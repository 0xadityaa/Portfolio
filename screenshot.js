const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Go to localhost:3000
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Take screenshot of experience section
  await page.screenshot({ path: '/Users/adityanegandhi/.gemini/antigravity/brain/ebffdab6-56a9-497f-8dfd-bbd9b42404e4/local-verification.png', fullPage: true });
  
  await browser.close();
})();
