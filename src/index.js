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
];

const locales = ["en-US", "en-IN", "en-GB"];
const timezones = ["Asia/Kolkata", "Asia/Dubai", "Europe/London"];

const proxies = [null];

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

// ---------- GOOGLE SORRY ----------
// async function handleGoogleSorry(page) {
//   if (page.url().includes("/sorry")) {
//     console.log("⚠️ Google CAPTCHA page detected");
//     console.log("👉 Solve it manually...");
//     await page.waitForTimeout(30000);

//     await page.waitForFunction(
//       () => !location.href.includes("/sorry"),
//       { timeout: 60000 }
//     );
//   }
// }

// ---------- HUMAN TYPE ----------
async function humanType(page, selector, text) {
  const input = page.locator(selector);
  await input.focus();

  let typed = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (Math.random() < 0.04) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(900 + Math.random() * 1500);
      await page.keyboard.press("Shift+Tab");
    }

    if (Math.random() < 0.08 && /[a-z]/i.test(char)) {
      await page.keyboard.type(char + char);
      typed += char + char;

      const noiseCount = Math.floor(Math.random() * 2) + 1;
      for (let n = 0; n < noiseCount; n++) {
        const r = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        await page.keyboard.type(r);
        typed += r;
      }

      await page.waitForTimeout(800);
      for (let k = 0; k < noiseCount + 1; k++) {
        await page.keyboard.press("Backspace");
        typed = typed.slice(0, -1);
        await page.waitForTimeout(120);
      }
    }

    if (Math.random() < 0.08) {
      const wrong = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      await page.keyboard.type(wrong);
      typed += wrong;
      await page.waitForTimeout(850);
      await page.keyboard.press("Backspace");
      typed = typed.slice(0, -1);
    }

    await page.keyboard.type(char, { delay: Math.random() * 150 + 60 });
    typed += char;

    if (char === " ") await page.waitForTimeout(2800);
    if (Math.random() < 0.2)
      await page.waitForTimeout(2500 + Math.random() * 4000);
  }

  const finalValue = await input.inputValue();
  if (finalValue !== text) {
    console.log("🔧 Fixing final query");
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(text, { delay: 400 });
  }
console.log("error:" ,finalValue)
  await page.waitForTimeout(8000);
}

// ---------- SCROLL ----------
async function smartScroll(page) {
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, Math.random() * 100 + 400);
    await page.waitForTimeout(Math.random() * 2000 + 1000);
  }
}

// ================= MAIN =================
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
  });

  // 🔥 HARD RESET — CLEAR ALL PREVIOUS DATA
  await context.clearCookies();
  console.log("idhr",clearCookies)
  await context.clearPermissions();

  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      });
    } catch (e) {}
    console.log("ho raha hai")
  });

  const page = await context.newPage();

  console.log("🔍 Opening Google...");
  await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });

  await waitIfCaptcha(page);

  try {
    await page.click(
      "button:has-text('Accept all'), button:has-text('I agree')",
      { timeout: 5000 }
    );
  } catch {}

  const searchSelector = "textarea[name='q'], input[name='q']";
  await page.waitForSelector(searchSelector);
  await page.click(searchSelector);
  await page.waitForTimeout(2200);

  console.log("⌨️ Human typing...");
  await humanType(page, searchSelector, searchText);

  await page.keyboard.press("Enter");

  await handleGoogleSorry(page);
  await waitIfCaptcha(page);

  await page.waitForSelector("div#search a h3", { timeout: 30000 });

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
