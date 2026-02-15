const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots-repo');

// Modal screenshots to capture
const modalCaptures = [
  {
    page: '/schedules',
    name: 'schedules-create-modal',
    description: 'Create Schedule Modal',
    action: async (page) => {
      // Wait for page to load
      await page.waitForSelector('button', { timeout: 5000 });
      // Click the Create button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Create Schedule')) {
          await button.click();
          break;
        }
      }
      // Wait for modal to appear
      await page.waitForSelector('form', { timeout: 3000 });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    page: '/schedules',
    name: 'schedules-edit-modal',
    description: 'Edit Schedule Modal',
    action: async (page) => {
      // Wait for page to load
      await page.waitForSelector('button', { timeout: 5000 });
      // Click the first Edit button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Edit')) {
          await button.click();
          break;
        }
      }
      // Wait for modal to appear
      await page.waitForSelector('form', { timeout: 3000 });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    page: '/actions',
    name: 'actions-create-modal',
    description: 'Create Action Modal',
    action: async (page) => {
      // Wait for page to load
      await page.waitForSelector('button', { timeout: 5000 });
      // Click the Create button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Create Action')) {
          await button.click();
          break;
        }
      }
      // Wait for modal to appear
      await page.waitForSelector('form', { timeout: 3000 });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  {
    page: '/actions',
    name: 'actions-edit-modal',
    description: 'Edit Action Modal',
    action: async (page) => {
      // Wait for page to load
      await page.waitForSelector('button', { timeout: 5000 });
      // Click the first Edit button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Edit')) {
          await button.click();
          break;
        }
      }
      // Wait for modal to appear
      await page.waitForSelector('form', { timeout: 3000 });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
];

const viewports = [
  {
    name: 'desktop',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
];

async function captureModalScreenshots() {
  console.log('🚀 Starting modal screenshot capture...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${SCREENSHOTS_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  let totalScreenshots = 0;

  for (const capture of modalCaptures) {
    console.log(`📸 Capturing: ${capture.description}`);

    for (const viewport of viewports) {
      try {
        await page.setViewport(viewport);

        // Set auth cookie
        await page.setCookie({
          name: 'cronny_auth_token',
          value: 'mock-token-for-screenshot',
          domain: 'localhost',
          path: '/',
        });

        const url = `${BASE_URL}${capture.page}`;
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Execute the action to open the modal
        await capture.action(page);

        const filename = `${capture.name}-${viewport.name}.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);

        await page.screenshot({
          path: filepath,
          fullPage: false,
        });

        console.log(`  ✓ ${viewport.name}: ${filename}`);
        totalScreenshots++;
      } catch (error) {
        console.error(`  ✗ ${viewport.name}: Failed - ${error.message}`);
      }
    }
    console.log('');
  }

  await browser.close();

  console.log(`✅ Complete! Captured ${totalScreenshots} modal screenshots\n`);
  console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
}

captureModalScreenshots().catch(error => {
  console.error('❌ Error capturing screenshots:', error);
  process.exit(1);
});
