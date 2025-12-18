















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
    "text=I'm not a robot",
    "#captcha",
    "text=unusual traffic",
  ];

  for (const selector of captchaSelectors) {
    if ((await page.locator(selector).count()) > 0) {
      console.log("\n⚠️ CAPTCHA detected!");
      console.log("👉 Please solve it manually in the browser.");
      console.log("⏳ Waiting...\n");

      await page.waitForTimeout(15000); // manual solve time
      break;
    }
  }
}

// ---------- SLOW SCROLL ----------
async function slowScroll(page) {
  console.log("🌀 Scrolling slowly to load listings...");

  for (let i = 0; i < 20; i++) {
    // Increased for better lazy loading
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1500);
  }

  // Full scroll to bottom for any remaining lazy loads
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(5000);
}

(async () => {
  const searchText = await askQuestion("What would you want to search? 👉 ");
  rl.close();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // ---------- Open Google ----------
  await page.goto("https://www.google.com", {
    waitUntil: "domcontentloaded",
  });

  await waitIfCaptcha(page);

  try {
    await page.click("button:has-text('Accept all')", { timeout: 10000 });
  } catch {}

  // ---------- Search ----------
  const searchBox = page.locator("textarea[name='q']");
  await searchBox.fill(searchText);
  await page.waitForTimeout(3000);
  await page.keyboard.press("Enter");

  await waitIfCaptcha(page);

  await page.waitForSelector("div#search a h3", { timeout: 20000 });
  await page.waitForTimeout(3000);

  const firstResult = page.locator("div#search a:has(h3)").first();
  const targetUrl = await firstResult.getAttribute("href");

  console.log("\n🔗 Navigating to:", targetUrl);
  await firstResult.click();

  await waitIfCaptcha(page);

  // ---------- Target page (FIXED: Use domcontentloaded + selector wait to avoid timeout) ----------
  await page.waitForLoadState("domcontentloaded"); // Safer than networkidle for JS-heavy sites
  await page.waitForTimeout(8000); // Buffer for initial JS load

  // ---------- Click "For Sale" tab if present ----------
  try {
    const saleTab = page.locator(
      'text="For Sale", button:has-text("For Sale"), a:has-text("For Sale")'
    );
    if ((await saleTab.count()) > 0) {
      await saleTab.click({ timeout: 8000 });
      console.log("✅ Switched to 'For Sale' listings.");
      await page.waitForTimeout(5000);
    }
  } catch (e) {
    console.log("ℹ️ No 'For Sale' tab found or already on sales page.");
  }

  // ---------- Wait for listings to appear (robust selector) ----------
  try {
    await page.waitForSelector(
      'div[class*="Tuple"], [data-qa="projectTuple"], [data-qa="propertyCard"]',
      { timeout: 20000 }
    );
    console.log("✅ Listings detected.");
  } catch (e) {
    console.log(
      "⚠️ No listings found after wait – try manual refresh or adjust search."
    );
  }

  // ---------- Scroll ----------
  await slowScroll(page);

  // ---------- SCRAPE FROM VISIBLE CARDS (UNCHANGED FROM LAST, AS IT WORKS WITH BROADER SELECTORS) ----------
  const scrapeResult = await page.evaluate(() => {
    const results = [];
    const seen = new Set();

    // Broader selector for 99acres tuples
    const cards = document.querySelectorAll(
      'div[class*="Tuple"], [data-qa="projectTuple"], [data-qa="propertyCard"]'
    );

    console.log(`Found ${cards.length} potential cards.`); // Debug in browser console

    for (const card of cards) {
      if (results.length >= 4) break;

      // Robust title
      const titleElement = card.querySelector(
        '[data-qa="title"], a.DtlsLink, a.srpTuple__link, a.projectTitle, h2, h3'
      );
      const title =
        titleElement?.innerText?.trim() ||
        card.querySelector("a, h1, h2, h3, h4")?.innerText?.trim();

      // Improved price regex
      const priceMatch = card.innerText.match(
        /₹\s?[\d,]+\.?\d*\s*(Cr|Lakh|K|Lacs)?/i
      );
      const price = priceMatch ? priceMatch[0] : null;

      // Link: Priority detail links, resolve relative
      let linkElement = card.querySelector(
        'a[href*="/property"], a.DtlsLink, a.srpTuple__link, [data-qa="link"]'
      );
      if (!linkElement) linkElement = card.querySelector("a");
      let link = linkElement?.href || linkElement?.getAttribute("href");
      if (link && !link.startsWith("http"))
        link = "https://www.99acres.com" + link;

      // Description
      const descElement = card.querySelector(
        '[data-qa="desc"], .srpTuple__desc, .projectDesc, p'
      );
      const description =
        descElement?.innerText?.trim().substring(0, 200) || null;

      // Skip invalids or dups
      const uniqueKey = link || title + price;
      if (!title || !price || !link || seen.has(uniqueKey)) continue;

      seen.add(uniqueKey);

      results.push({
        title,
        price,
        link,
        description,
      });
    }

    return { results, numCards: cards.length };
  });

  const { results: data, numCards } = scrapeResult;
  console.log(
    `\n📊 Debug: Found ${numCards} potential cards, extracted ${data.length} unique ones.`
  );
  console.log("\n📦 Extracted Data (JSON):");
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})();
