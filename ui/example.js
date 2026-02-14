const puppeteer = require('puppeteer');

async function main() {
  console.log('Launching browser...');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    // Create a new page
    const page = await browser.newPage();

    // Navigate to a URL
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', {
      waitUntil: 'networkidle2'
    });

    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved as screenshot.png');

    // Example: Get text content
    const content = await page.evaluate(() => {
      return document.querySelector('h1')?.textContent;
    });
    console.log(`H1 content: ${content}`);

    // Wait a bit to see the browser
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    console.log('Closing browser...');
    await browser.close();
  }
}

main().catch(console.error);
