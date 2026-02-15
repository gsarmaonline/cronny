const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots-repo');

// Define all pages/routes in your app
const routes = [
  {
    path: '/',
    name: 'home',
    description: 'Home page / Landing page'
  },
  {
    path: '/login',
    name: 'login',
    description: 'Login page'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    description: 'Main dashboard view',
    requiresAuth: true
  },
  {
    path: '/schedules',
    name: 'schedules',
    description: 'Schedules management page',
    requiresAuth: true
  },
  {
    path: '/actions',
    name: 'actions',
    description: 'Actions management page',
    requiresAuth: true
  },
];

// Viewport configurations for responsive screenshots
const viewports = [
  {
    name: 'desktop',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
  },
  {
    name: 'mobile',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
  },
];

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${SCREENSHOTS_DIR}\n`);

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  let totalScreenshots = 0;
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  for (const route of routes) {
    console.log(`📸 Capturing: ${route.path} (${route.description})`);

    for (const viewport of viewports) {
      try {
        await page.setViewport(viewport);

        // If route requires auth, set a mock token
        if (route.requiresAuth) {
          await page.setCookie({
            name: 'cronny_auth_token',
            value: 'mock-token-for-screenshot',
            domain: 'localhost',
            path: '/',
          });
        }

        const url = `${BASE_URL}${route.path}`;

        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait a bit for any animations or dynamic content
        await new Promise(resolve => setTimeout(resolve, 1000));

        const filename = `${route.name}-${viewport.name}.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);

        await page.screenshot({
          path: filepath,
          fullPage: false, // Set to true if you want full page screenshots
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

  // Generate index file with metadata
  const metadata = {
    lastUpdated: new Date().toISOString(),
    date: timestamp,
    baseUrl: BASE_URL,
    totalScreenshots,
    routes: routes.map(r => ({
      path: r.path,
      name: r.name,
      description: r.description,
      screenshots: viewports.map(v => `${r.name}-${v.name}.png`)
    })),
    viewports: viewports.map(v => ({
      name: v.name,
      width: v.width,
      height: v.height,
    })),
  };

  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`✅ Complete! Captured ${totalScreenshots} screenshots\n`);
  console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log(`📄 Metadata saved to: ${path.join(SCREENSHOTS_DIR, 'metadata.json')}\n`);
}

// Handle errors
captureScreenshots().catch(error => {
  console.error('❌ Error capturing screenshots:', error);
  process.exit(1);
});
