import { chromium } from "playwright";
import readline from "readline";

// ---------- Ask input ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

// ---------- CAPTCHA HANDLER ----------
async function waitIfCaptcha(page) {
  const captchaSelectors = [
    "iframe[src*='recaptcha']",
    "iframe[src*='captcha']",
    "text=I'm not a robot",
    "#captcha",
    "text=unusual traffic",
    "text=verify you are human",
  ];

  for (const selector of captchaSelectors) {
    if ((await page.locator(selector).count()) > 0) {
      console.log("\n⚠️ CAPTCHA detected!");
      console.log("👉 Please solve it manually in the browser.");
      console.log("⏳ Waiting 20 seconds for you to solve it...\n");
      await page.waitForTimeout(20000);
      break;
    }
  }
}

// ---------- SMART SCROLL TO LOAD DYNAMIC CONTENT ----------
async function smartScroll(page) {
  console.log("🌀 Scrolling to load more listings...");

  let previousHeight = 0;
  let sameHeightCount = 0;

  for (let i = 0; i < 25; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === previousHeight) {
      sameHeightCount++;
      if (sameHeightCount >= 3) break; // No more content loading
    } else {
      sameHeightCount = 0;
    }
    previousHeight = currentHeight;
  }

  await page.waitForTimeout(3000);
}

(async () => {
  const searchText = await askQuestion("What would you want to search? 👉 ");
  rl.close();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 60,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // ---------- Google Search ----------
  await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
  await waitIfCaptcha(page);

  try {
    await page.click("button:has-text('Accept all'), button:has-text('I agree')", { timeout: 8000 });
  } catch {}

  const searchBox = page.locator("textarea[name='q'], input[name='q']");
  await searchBox.fill(searchText);
  await page.waitForTimeout(2000);
  await page.keyboard.press("Enter");

  await waitIfCaptcha(page);
  await page.waitForSelector("div#search a h3", { timeout: 20000 });

  const firstResult = page.locator("div#search a:has(h3)").first();
  const targetUrl = await firstResult.getAttribute("href");
  console.log("\n🔗 Navigating to:", targetUrl);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    firstResult.click(),
  ]);

  await waitIfCaptcha(page);
  await page.waitForTimeout(8000);

  // ---------- Try to switch to "For Sale" if exists ----------
  // const saleKeywords = ["For Sale", "Buy", "Sale", "Purchase", "Properties for Sale"];
  // for (const keyword of saleKeywords) {
  //   try {
  //     const tab = page.locator(`text="${keyword}"`).first();
  //     if (await tab.isVisible({ timeout: 5000 })) {
  //       await tab.click();
  //       console.log(`✅ Clicked on "${keyword}" tab.`);
  //       await page.waitForTimeout(5000);
  //       break;
  //     }
  //   } catch {}
  // }

  // ---------- Scroll to load listings ----------
  await smartScroll(page);

  // ---------- UNIVERSAL SCRAPING LOGIC (Works on ANY site) ----------
  const data = await page.evaluate(() => {
    const results = [];
    const seenLinks = new Set();

    // Very broad card detection: any div/section/article with price-like text
    const potentialCards = Array.from(
      document.querySelectorAll("div, section, article, li, .card, .listing, .property")
    ).filter((el) => {
      const text = el.innerText || "";
      return /₹|\$|₹\s*\d|Price|Cr|Lakh|Lac|K/i.test(text);
    });

    console.log(`Found ${potentialCards.length} potential property cards.`);

    for (const card of potentialCards) {
      if (results.length >= 4) break;

      // Extract price (₹, Cr, Lakh, Lac, K)
      const priceMatch = card.innerText.match(/(₹\s*[\d.,]+(?:\s*(Cr|Lakh|Lac|K))?)/i);
      const price = priceMatch ? priceMatch[0].trim() : null;

      // Extract title (from headings or prominent links)
      let title = null;
      const titleCandidates = [
        ...card.querySelectorAll("h1, h2, h3, h4, a, span, div"),
      ].filter((el) => {
        const text = el.innerText.trim();
        return text.length > 5 && text.length < 150 && !/₹|Price|Cr|Lakh/.test(text);
      });

      if (titleCandidates.length > 0) {
        title = titleCandidates[0].innerText.trim();
      }

      // Extract link (first meaningful <a> tag)
      const linkElement = card.querySelector("a[href*='property'], a[href*='flat'], a[href*='house'], a[href]");
      let link = linkElement?.href || null;
      if (link && !link.startsWith("http")) {
        link = new URL(link, window.location.origin).href;
      }

      // Extract short description
      const descElement = card.querySelector("p, div, span");
      let description = null;
      if (descElement) {
        description = descElement.innerText.trim();
        if (description.length > 300) description = description.substring(0, 250) + "...";
      }

      // Skip if missing essentials or duplicate link
      if (!title || !price || !link || seenLinks.has(link)) continue;

      seenLinks.add(link);

      results.push({
        title,
        price,
        link,
        description,
      });
    }

    return results;
  });

  console.log(`\n📊 Extracted ${data.length} unique properties.\n`);
  console.log("📦 Extracted Data (JSON):");
  console.log(JSON.stringify(data, null, 2));

  if (data.length === 0) {
    console.log("\n⚠️ No properties found. Tips:");
    console.log("   • Try a more specific search like 'independent house for sale sector 55 noida'");
    console.log("   • Manually scroll or click filters on the page if needed.");
  }

  await browser.close();
})();