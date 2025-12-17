export async function scrapeLoginPage(page) {
//   await page.goto("https://netbanking.hdfcbank.com/netbanking/", {
  await page.goto("https://the-internet.herokuapp.com/login", {
    waitUntil: "networkidle"
  });

// https://the-internet.herokuapp.com/login

// https://quotes.toscrape.com/js/

  await page.waitForSelector(".quote");


//   const title = await page.title();
//   const usernamePlaceholder = await page.getAttribute("#username", "placeholder");
//   const passwordPlaceholder = await page.getAttribute("#password", "placeholder");
//   const loginButtonText = await page.textContent("button");


  const quotes = await page.$$eval(".quote", (nodes) =>
    nodes.map((quote) => {
      const text = quote.querySelector(".text")?.innerText.trim();
      const author = quote.querySelector(".author")?.innerText.trim();
      const tags = Array.from(
        quote.querySelectorAll(".tags .tag")
      ).map((el) => el.innerText.trim());

      return { text, author, tags };
    })
  );

//   return {
//     title,
//     usernamePlaceholder,
//     passwordPlaceholder,
//     loginButtonText

//   };
return quotes;
}
