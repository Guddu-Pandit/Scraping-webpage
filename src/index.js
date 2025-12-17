import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage(); // ✅ FIXED

  await page.goto("https://bankofindia.bank.in/", {
    waitUntil: "domcontentloaded",
  });

  console.log("Solve the captcha manually...");
  await page.waitForTimeout(10000);

  // Select English
  await page
    .locator("button.closeButton", { hasText: "English" })
    .click({ timeout: 5000 });

  console.log("✅ English selected");

  // Click Internet Banking
  await page
    .locator("button.login-primary-link", {
      hasText: "Internet Banking",
    })
    .click();

  console.log("✅ Internet Banking dropdown clicked");

  // Wait for dropdown
  const dropdown = page.locator(".login-dropdown-menu.show");
  await dropdown.waitFor({ state: "visible", timeout: 8000 });

  // Click Omni Neo Retail Login
  await dropdown
    .locator("span:has-text('Omni Neo Retail')")
    .locator("xpath=following-sibling::span//a")
    .click();

  console.log("✅ Omni Neo Retail Login clicked");

  // 🔑 STRICT-SAFE: target ONLY Disclaimer modal
  const agreeBtn = page.locator(
  ".modal-content:visible button.confirmRedirect",
  { hasText: "Agree" }
);

await agreeBtn.waitFor({ state: "visible", timeout: 15000 });
await agreeBtn.click();

console.log("✅ Agree clicked safely");


  // Click Agree + capture new tab
  const [loginPage] = await Promise.all([
    context.waitForEvent("page"),
    agreeBtn.click(),
  ]);

  await loginPage.waitForLoadState("domcontentloaded");
  console.log("✅ New tab opened after Agree");

  await loginPage.waitForTimeout(10000);
  await browser.close();
})();
