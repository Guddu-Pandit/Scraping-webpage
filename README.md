# 🔍 Advanced Property Scraper

A robust Node.js web scraping tool powered by **Playwright** and **Puppeteer**. Designed for high-reliability data extraction from real estate platforms (like 99acres) while actively evading anti-bot mechanisms.

## ✨ Features

- **🛡️ Anti-Bot Evasion**:
  - Randomized User-Agent, Viewport, Locale, and Timezone rotation.
  - Human-like interaction (variable typing speeds, natural mouse scrolling, and "mistake" simulations).
  - Automation flags bypass (`--disable-blink-features=AutomationControlled`).
- **🧩 CAPTCHA Handling**: Early/Late detection of reCAPTCHA and unusual traffic prompts with automated manual solve waiting.
- **🌐 Google Search Integration**: Navigates through Google to mimic realistic user discovery flows.
- **📊 Robust Data Extraction**:
  - Multi-selector fallback for dynamic listing structures.
  - Smart regex filtering for price and property details.
  - Deduplication and JSON output generation.

## 🛠️ Tech Stack

- **Core**: [Node.js](https://nodejs.org/)
- **Automation**: [Playwright](https://playwright.dev/), [Puppeteer](https://pptr.dev/)
- **Utility**: [Axios](https://axios-http.com/), [jsdom](https://github.com/jsdom/jsdom)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Usage
Run the default scraper:
```bash
npm start
```
Follow the prompt to enter your search query (e.g., "villas for sale in Gurgaon").

## 📁 Project Structure

- `src/index.js`: Main entry point with advanced rotation and Google flow.
- `src/Acer.js`: Dedicated scraper optimized for real estate listing cards.
- `output.json`: Generated file containing extracted listings.

## ⚖️ Disclaimer
This tool is for educational purposes only. Always respect `robots.txt` and the Terms of Service of target websites before scraping.


---

Developed with ❤️ by [Guddu-Pandit](https://github.com/Guddu-Pandit)
