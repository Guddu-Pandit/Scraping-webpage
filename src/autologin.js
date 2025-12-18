export async function autoLogin(page) {
  // 1. Open page
  await page.goto("https://the-internet.herokuapp.com/", {
  // await page.goto("https://the-internet.herokuapp.com/", {
  // await page.goto("https://bankofindia.bank.in/", {
    waitUntil: "networkidle"
  });


  await page.click("a[href='/login']");
  // 2. Enter username automatically
  await page.fill("#username", "tomsmith");

  // 3. Enter password automatically
  await page.fill("#password", "SuperSecretPassword!");

  // 4. Click login button
  await page.click("button[type='submit']");

  // await page.click("button.close", { force: true });


  // 5. Wait for successful login
  await page.waitForSelector(".flash.success");
}


// boi net banking

// import { chromium } from "playwright";

// (async () => {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page = await context.newPage(); // ✅ FIXED

//   await page.goto("https://bankofindia.bank.in/", {
//     waitUntil: "domcontentloaded",
//   });

//   console.log("Solve the captcha manually...");
//   await page.waitForTimeout(10000);

//   // Select English
//   await page
//     .locator("button.closeButton", { hasText: "English" })
//     .click({ timeout: 5000 });

//   console.log("✅ English selected");

//   // Click Internet Banking
//   await page
//     .locator("button.login-primary-link", {
//       hasText: "Internet Banking",
//     })
//     .click();

//   console.log("✅ Internet Banking dropdown clicked");

//   // Wait for dropdown
//   const dropdown = page.locator(".login-dropdown-menu.show");
//   await dropdown.waitFor({ state: "visible", timeout: 8000 });

//   // Click Omni Neo Retail Login
//   await dropdown
//     .locator("span:has-text('Omni Neo Retail')")
//     .locator("xpath=following-sibling::span//a")
//     .click();

//   console.log("✅ Omni Neo Retail Login clicked");

//   // 🔑 STRICT-SAFE: target ONLY Disclaimer modal
//   const agreeBtn = page.locator(
//   ".modal-content:visible button.confirmRedirect",
//   { hasText: "Agree" }
// );

// await agreeBtn.waitFor({ state: "visible", timeout: 15000 });
// await agreeBtn.click();

// console.log("✅ Agree clicked safely");


//   // Click Agree + capture new tab
//   const [loginPage] = await Promise.all([
//     context.waitForEvent("page"),
//     agreeBtn.click(),
//   ]);

//   await loginPage.waitForLoadState("domcontentloaded");
//   console.log("✅ New tab opened after Agree");

//   await loginPage.waitForTimeout(10000);
//   await browser.close();
// })();






//poperites
// import { chromium } from "playwright";
// import readline from "readline";

// // ---------- Ask input ----------
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// function askQuestion(q) {
//   return new Promise((resolve) => rl.question(q, resolve));
// }

// (async () => {
//   const searchText = await askQuestion("What would you want to search? 👉 ");
//   rl.close();

//   const browser = await chromium.launch({
//     headless: false,
//     slowMo: 50,
//   });

//   const context = await browser.newContext();
//   const page = await context.newPage();

//   // ---------- Open Google ----------
//   await page.goto("https://www.google.com", {
//     waitUntil: "domcontentloaded",
//   });

//   async function waitIfCaptcha(page) {
//     const captchaSelectors = [
//       "iframe[src*='recaptcha']",
//       "text=I'm not a robot",
//       "#captcha",
//       "text=unusual traffic"
//     ];

//     for (const selector of captchaSelectors) {
//       if (await page.locator(selector).count() > 0) {
//         console.log("\n⚠️ CAPTCHA detected!");
//         console.log("👉 Please solve it manually in the browser.");
//         console.log("⏳ Waiting for you to finish...\n");

//         await page.waitForFunction(() => {
//           return !document.body.innerText
//             .toLowerCase()
//             .includes("unusual traffic");
//         }, { timeout: 0 });

//         console.log("✅ CAPTCHA solved, resuming script...\n");
//         break;
//       }
//     }
//   }

//   // Accept cookies (India-safe)
//   try {
//     await page.click("button:has-text('Accept all')", { timeout: 10000 });
//   } catch {}

//   // ---------- Search ----------
//   const searchBox = page.locator("textarea[name='q']");
//   await searchBox.waitFor();
//   await searchBox.fill(searchText);

//   // 🕒 WAIT 3 seconds after typing
//   await page.waitForTimeout(3000);

//   // Wait for suggestions
//   await page.waitForSelector("ul[role='listbox'] li", { timeout: 20000 });

//   // Click first suggestion
//   await page.locator("ul[role='listbox'] li").first().click();

//   // 🕒 WAIT for page to load fully
//   await page.waitForLoadState("networkidle");

//   // 🕒 EXTRA wait after page load
//   await page.waitForTimeout(2000);

//   // ---------- IMPORTANT FIX ----------
//   // Wait for real search results
//   await page.waitForSelector("div#search a h3", { timeout: 25000 });

//   // 🕒 WAIT before extracting results
//   await page.waitForTimeout(2000);

//   // ---------- Extract first 4 results ----------
//   const results = await page.evaluate(() => {
//     const data = [];
//     const items = document.querySelectorAll("div#search a h3");

//     for (let i = 0; i < items.length && data.length < 4; i++) {
//       const title = items[i].innerText;
//       const link = items[i].closest("a")?.href;

//       if (title && link) {
//         data.push({ title, link });
//       }
//     }

//     return data;
//   });

//   console.log("\n📦 Extracted Data (JSON):");
//   console.log(JSON.stringify(results, null, 2));

//   await browser.close();
// })();



