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
