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

<<<<<<< HEAD
// ---------- SLOW HUMAN-LIKE SCROLL ----------
async function smartScroll(page) {
  console.log("🌀 Scrolling slowly to load more listings...");
=======
// ---------- SMART SCROLL TO LOAD DYNAMIC CONTENT ----------
async function smartScroll(page) {
  console.log("🌀 Scrolling to load more listings...");
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50

  let previousHeight = 0;
  let sameHeightCount = 0;

<<<<<<< HEAD
  for (let i = 0; i < 50; i++) { // More iterations for slow scroll
    // Scroll down incrementally (human-like)
    await page.evaluate(() => window.scrollBy(0, Math.random() * 800 + 400)); // Random 400-1200px
    await page.waitForTimeout(Math.random() * 2000 + 1000); // Random 1-3s pause
=======
  for (let i = 0; i < 25; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === previousHeight) {
      sameHeightCount++;
<<<<<<< HEAD
      if (sameHeightCount >= 3) break;
=======
      if (sameHeightCount >= 3) break; // No more content loading
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50
  const data = await page.evaluate(() => {
    const results = [];
    const seenLinks = new Set();

<<<<<<< HEAD
    // Very broad card detection: any container with price-like text
    const potentialCards = Array.from(
      document.querySelectorAll("div, section, article, li, .card, .listing, .property, .item, .result")
    ).filter((el) => {
      const text = (el.innerText || "").toLowerCase();
      return /₹\d|cr|lakh|sq\.?\s*(ft|m|yd)|bhk|bedroom|plot|house|villa/i.test(text);
=======
    // Very broad card detection: any div/section/article with price-like text
    const potentialCards = Array.from(
      document.querySelectorAll("div, section, article, li, .card, .listing, .property")
    ).filter((el) => {
      const text = el.innerText || "";
      return /₹|\$|₹\s*\d|Price|Cr|Lakh|Lac|K/i.test(text);
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50
    });

    console.log(`Found ${potentialCards.length} potential property cards.`);

    for (const card of potentialCards) {
      if (results.length >= 4) break;

<<<<<<< HEAD
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

=======
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

>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50
      seenLinks.add(link);

      results.push({ title, price, link, description });
    }

    return results;
  });

<<<<<<< HEAD
  console.log(`\n📊 Extracted ${data.length} clean unique properties.\n`);
  console.log("📦 Clean Extracted Data (JSON):");
=======
  console.log(`\n📊 Extracted ${data.length} unique properties.\n`);
  console.log("📦 Extracted Data (JSON):");
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50
  console.log(JSON.stringify(data, null, 2));

  if (data.length === 0) {
    console.log("\n⚠️ No properties found. Tips:");
<<<<<<< HEAD
    console.log("   • Try queries like: 'independent house for sale '");
=======
    console.log("   • Try a more specific search like 'independent house for sale sector 55 noida'");
    console.log("   • Manually scroll or click filters on the page if needed.");
>>>>>>> 934828d8d19285d954a2a094bb51205855c93e50
  }

  await browser.close();
})();