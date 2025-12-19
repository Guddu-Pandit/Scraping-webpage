import { chromium } from "playwright";
import readline from "readline";

// ---------- USER INPUT ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

// ---------- ROTATION DATA ----------
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36",
];

const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
];

const locales = ["en-US", "en-IN", "en-GB"];
const timezones = ["Asia/Kolkata", "Asia/Dubai", "Europe/London"];

// ---------- OPTIONAL PROXIES ----------
const proxies = [
  // Example format (replace with real proxies)
  // { server: "http://ip:port", username: "user", password: "pass" }
  null,
];

// ---------- CAPTCHA ----------
async function waitIfCaptcha(page) {
  const captchaTexts = ["unusual traffic", "verify you are human", "captcha"];
  for (const text of captchaTexts) {
    if ((await page.locator(`text=${text}`).count()) > 0) {
      console.log("⚠️ CAPTCHA detected — solve manually");
      await page.waitForTimeout(25000);
      break;
    }
  }
}

// ---------- THINKING PAUSE ----------
async function thinkingPause() {
  if (Math.random() < 0.25) {
    const pause = Math.random() * 2500 + 1500;
    console.log(`🤔 Thinking pause ${Math.round(pause)}ms`);
    await new Promise(r => setTimeout(r, pause));
  }
}

// ---------- HUMAN TYPING ----------
async function humanType(page, selector, text) {
  const box = await page.locator(selector);
  const bb = await box.boundingBox();

  for (const char of text) {
    // Move mouse slightly while typing
    await page.mouse.move(
      bb.x + Math.random() * bb.width,
      bb.y + Math.random() * bb.height,
      { steps: 4 }
    );

    // 🧠 RANDOM TYPING ERROR (1–3 wrong letters)
    if (Math.random() < 0.12) { // ~12% chance
      const errorLength = Math.floor(Math.random() * 3) + 1; // 1–3 chars
      let wrongChars = "";

      for (let i = 0; i < errorLength; i++) {
        const randChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        wrongChars += randChar;
        await page.keyboard.type(randChar, { delay: 80 + Math.random() * 80 });
      }

      // Pause like "oh wait that's wrong"
      await page.waitForTimeout(400 + Math.random() * 600);

      // Correct the mistake using backspace
      for (let i = 0; i < wrongChars.length; i++) {
        await page.keyboard.press("Backspace");
        await page.waitForTimeout(120 + Math.random() * 120);
      }
    }

    // Type the correct character
    await page.keyboard.type(char, {
      delay: Math.random() * 180 + 60,
    });

    // Pause longer after space (thinking)
    if (char === " ") {
      await page.waitForTimeout(2000);
    }

    // Random thinking pause mid-typing
    if (Math.random() < 0.25) {
      await page.waitForTimeout(Math.random() * 2500 + 1500);
    }
  }

  // Final pause before Enter
  await page.waitForTimeout(4000);
}

// ---------- SCROLL ----------
async function smartScroll(page) {
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, Math.random() * 800 + 400);
    await page.waitForTimeout(Math.random() * 2000 + 1000);
  }
}

(async () => {
  const searchText = await askQuestion("What would you want to search? 👉 ");
  rl.close();

  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
  const viewport = viewports[Math.floor(Math.random() * viewports.length)];
  const locale = locales[Math.floor(Math.random() * locales.length)];
  const timezoneId = timezones[Math.floor(Math.random() * timezones.length)];

  const browser = await chromium.launch({
    headless: false,
    slowMo: 60,
    proxy: proxy || undefined,
  });

  const context = await browser.newContext({
    userAgent: ua,
    viewport,
    locale,
    timezoneId,
    deviceScaleFactor: Math.random() > 0.5 ? 1 : 1.25,
    hasTouch: false,
    isMobile: false,
  });

  const page = await context.newPage();

  console.log("🔍 Opening Google...");
  await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });

  await waitIfCaptcha(page);

  try {
    await page.click("button:has-text('Accept all'), button:has-text('I agree')", { timeout: 5000 });
  } catch {}

  const searchSelector = "textarea[name='q'], input[name='q']";
  await page.waitForSelector(searchSelector);
  await page.click(searchSelector);
  await page.waitForTimeout(1200);

  console.log("⌨️ Human typing with mistakes...");
  await humanType(page, searchSelector, searchText);

  console.log("↵ Enter pressed");
  await page.keyboard.press("Enter");

  await waitIfCaptcha(page);
  await page.waitForSelector("div#search a h3", { timeout: 20000 });

  const firstResult = page.locator("div#search a:has(h3)").first();
  const targetUrl = await firstResult.getAttribute("href");

  console.log("🔗 Opening:", targetUrl);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    firstResult.click(),
  ]);

  await waitIfCaptcha(page);
  await page.waitForTimeout(8000);

  await smartScroll(page);

  const data = await page.evaluate(() => {
    const out = [];
    const seen = new Set();

    document.querySelectorAll("div,article,section,li").forEach(el => {
      if (out.length >= 4) return;

      const text = el.innerText || "";
      if (!/₹|lakh|cr|bhk|villa/i.test(text)) return;

      const price = text.match(/₹\s*[\d.,]+(?:\s*(Cr|Lakh|Lac))?/i)?.[0];
      const link = el.querySelector("a[href]")?.href;
      const title = el.querySelector("h1,h2,h3,h4")?.innerText;

      if (price && link && title && !seen.has(link)) {
        seen.add(link);
        out.push({ title, price, link });
      }
    });

    return out;
  });

  console.log("\n📊 Extracted Data:\n", JSON.stringify(data, null, 2));
  await browser.close();
})();
