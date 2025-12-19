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
  const captchaTexts = [
    "unusual traffic",
    "verify you are human",
    "not a robot",
    "captcha",
  ];

  for (const text of captchaTexts) {
    if ((await page.locator(`text=${text}`).count()) > 0) {
      console.log("\n⚠️ CAPTCHA detected!");
      console.log("👉 Solve it manually in the browser...");
      await page.waitForTimeout(20000);
      break;
    }
  }
}

// ---------- HUMAN-LIKE SCROLL ----------
async function smartScroll(page) {
  console.log("🌀 Scrolling to load listings...");

  let lastHeight = 0;

  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 800 + 400);
    });
    await page.waitForTimeout(Math.random() * 2000 + 1000);

    const height = await page.evaluate(() => document.body.scrollHeight);
    if (height === lastHeight) break;
    lastHeight = height;
  }
}

// ---------- HUMAN TYPING WITH MOUSE ----------
async function humanType(page, selector, text) {
  const box = await page.locator(selector);
  const boundingBox = await box.boundingBox();

  for (const char of text) {
    // Random mouse move near search box
    await page.mouse.move(
      boundingBox.x + Math.random() * boundingBox.width,
      boundingBox.y + Math.random() * boundingBox.height,
      { steps: 5 }
    );

    await page.keyboard.type(char, {
      delay: Math.random() * 150 + 50, // random typing speed
    });

    // Pause 2 seconds after space
    if (char === " ") {
      await page.waitForTimeout(2000);
    }
  }

  // Wait 4 seconds after full typing
  await page.waitForTimeout(4000);
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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
  });

  const page = await context.newPage();

  // ---------- GOOGLE SEARCH ----------
  console.log("\n🔍 Opening Google...");
  await page.goto("https://www.google.com", {
    waitUntil: "domcontentloaded",
  });

  await waitIfCaptcha(page);

  try {
    await page.click(
      "button:has-text('Accept all'), button:has-text('I agree')",
      { timeout: 5000 }
    );
  } catch {}

  const searchBoxSelector = "textarea[name='q'], input[name='q']";
  await page.waitForSelector(searchBoxSelector);

  // Click search box like human
  await page.click(searchBoxSelector);
  await page.waitForTimeout(1000);

  console.log("⌨️ Typing search slowly like a human...");
  await humanType(page, searchBoxSelector, searchText);

  console.log("↵ Pressing Enter...");
  await page.keyboard.press("Enter");

  await waitIfCaptcha(page);
  await page.waitForSelector("div#search a h3", { timeout: 20000 });

  const firstResult = page.locator("div#search a:has(h3)").first();
  const targetUrl = await firstResult.getAttribute("href");

  if (!targetUrl) {
    console.log("❌ Could not get first Google result URL");
    await browser.close();
    return;
  }

  console.log("🔗 Navigating to:", targetUrl);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    firstResult.click(),
  ]);

  await waitIfCaptcha(page);
  await page.waitForTimeout(8000);

  // ---------- OPTIONAL SALE TAB ----------
  // const saleTabs = ["Buy", "For Sale", "Sale", "Properties"];
  // for (const tab of saleTabs) {
  //   try {
  //     const el = page.locator(`text=${tab}`).first();
  //     if (await el.isVisible({ timeout: 3000 })) {
  //       await el.click();
  //       console.log(`✅ Clicked "${tab}" tab`);
  //       await page.waitForTimeout(5000);
  //       break;
  //     }
  //   } catch {}
  // }

  // ---------- SCROLL ----------
  await smartScroll(page);

  // ---------- WAIT FOR PRICE TEXT ----------
  console.log("⏳ Waiting for listings to appear...");
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll("body *")).some((el) =>
      /₹\s*\d|cr|lakh|bhk|bedroom|villa|house/i.test(el.innerText || "")
    );
  }, { timeout: 30000 });

  await page.waitForTimeout(5000);

  // ---------- SCRAPING ----------
  const data = await page.evaluate(() => {
    const results = [];
    const seen = new Set();

    const cards = Array.from(
      document.querySelectorAll("div, section, article, li")
    ).filter((el) =>
      /₹\s*\d|cr|lakh|bhk|bedroom|villa|house/i.test(el.innerText || "")
    );

    for (const card of cards) {
      if (results.length >= 4) break;

      const text = card.innerText.replace(/\s+/g, " ");

      const priceMatch = text.match(/₹\s*[\d.,]+(?:\s*(Cr|Lakh|Lac))?/i);
      const price = priceMatch ? priceMatch[0] : null;

      let title = null;
      for (const el of card.querySelectorAll("h1,h2,h3,h4,a,span,div")) {
        const t = el.innerText?.trim();
        if (t && t.length > 15 && t.length < 150) {
          title = t;
          break;
        }
      }

      let link = card.querySelector("a[href]")?.href;
      if (link && !link.startsWith("http")) {
        link = new URL(link, location.origin).href;
      }

      if (!title || !price || !link || seen.has(link)) continue;
      seen.add(link);

      results.push({ title, price, link });
    }

    return results;
  });

  // ---------- OUTPUT ----------
  console.log(`\n📊 Extracted ${data.length} properties:\n`);
  console.log(JSON.stringify(data, null, 2));

  if (data.length === 0) {
    console.log("\n⚠️ No properties extracted.");
    console.log("Try refining the search query.");
  }

  await browser.close();
})();
