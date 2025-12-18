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

// ---------- SLOW HUMAN-LIKE SCROLL ----------
async function smartScroll(page) {
  console.log("🌀 Scrolling slowly to load more listings...");

  let previousHeight = 0;
  let sameHeightCount = 0;

  for (let i = 0; i < 50; i++) { // More iterations for slow scroll
    // Scroll down incrementally (human-like)
    await page.evaluate(() => window.scrollBy(0, Math.random() * 800 + 400)); // Random 400-1200px
    await page.waitForTimeout(Math.random() * 2000 + 1000); // Random 1-3s pause

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === previousHeight) {
      sameHeightCount++;
      if (sameHeightCount >= 3) break;
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

  // ---------- Try to switch to "For Sale" / "Buy" tab ----------
  const saleKeywords = ["For Sale", "Buy", "Sale", "Purchase", "Properties for Sale", "Buy Property"];
  for (const keyword of saleKeywords) {
    try {
      const tab = page.locator(`text="${keyword}"`).first();
      if (await tab.isVisible({ timeout: 5000 })) {
        await tab.click();
        console.log(`✅ Clicked on "${keyword}" tab.`);
        await page.waitForTimeout(5000);
        break;
      }
    } catch {}
  }

  // ---------- Scroll to load listings ----------
  await smartScroll(page);

  // ---------- FULLY UNIVERSAL SCRAPING LOGIC (Works on 99acres, Magicbricks, Housing.com, SquareYards, etc.) ----------
  const data = await page.evaluate(() => {
    const results = [];
    const seenLinks = new Set();

    // Very broad card detection: any container with price-like text
    const potentialCards = Array.from(
      document.querySelectorAll("div, section, article, li, .card, .listing, .property, .item, .result")
    ).filter((el) => {
      const text = (el.innerText || "").toLowerCase();
      return /₹\d|cr|lakh|sq\.?\s*(ft|m|yd)|bhk|bedroom|plot|house|villa/i.test(text);
    });

    console.log(`Found ${potentialCards.length} potential property cards.`);

    for (const card of potentialCards) {
      if (results.length >= 4) break;

      // Price
      const priceMatch = card.innerText.match(/(₹\s*[\d.,]+(?:\s*(Cr|Lakh|Lac|K))?)/i);
      const price = priceMatch ? priceMatch[0].trim() : null;

      // Title - pick first meaningful heading/link text
      let title = null;
      const titleEls = card.querySelectorAll("h1, h2, h3, h4, a, span, div");
      for (const el of titleEls) {
        let txt = el.innerText.trim().replace(/\n/g, " ").replace(/\s+/g, " ");
        if (txt.length > 10 && txt.length < 200 && !/buy|post|free|results|home|filter|sort/i.test(txt.toLowerCase())) {
          title = txt;
          break;
        }
      }

      // Link - first good link in card
      const linkEl = card.querySelector("a[href*='property'], a[href*='house'], a[href*='villa'], a[href*='plot'], a[href*='flat'], a");
      let link = linkEl ? linkEl.href : null;
      if (link && !link.startsWith("http")) link = new URL(link, window.location.origin).href;
      // Skip obvious non-listing links
      if (link && (link.includes("/search") || link.endsWith("/") || link.includes("/home"))) link = null;

      // Description
      let description = null;
      const descEls = card.querySelectorAll("p, div, span");
      for (const el of descEls) {
        let txt = el.innerText.trim().replace(/\n/g, " ").replace(/\s+/g, " ");
        if (txt.length > 30 && txt.length < 500) {
          description = txt.substring(0, 250) + (txt.length > 250 ? "..." : "");
          break;
        }
      }

      if (!title || !price || !link || seenLinks.has(link)) continue;

      seenLinks.add(link);

      results.push({ title, price, link, description });
    }

    return results;
  });

  console.log(`\n📊 Extracted ${data.length} clean unique properties.\n`);
  console.log("📦 Clean Extracted Data (JSON):");
  console.log(JSON.stringify(data, null, 2));

  if (data.length === 0) {
    console.log("\n⚠️ No properties found. Tips:");
    console.log("   • Try queries like: 'independent house for sale '");
  }

  await browser.close();
})();