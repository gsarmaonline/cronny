# Puppeteer E2E Tests

This directory contains end-to-end tests using Puppeteer for the Cronny UI.

## Test Files

- `puppeteer-basic.e2e.test.ts` - Basic Puppeteer functionality tests (standalone, no dev server needed)
- `puppeteer.e2e.test.ts` - Next.js application E2E tests (requires dev server)

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with headless mode (default)
```bash
npm run test:e2e:headless
```

### Run basic Puppeteer tests only
```bash
npm run test:e2e -- puppeteer-basic
```

### Run Next.js app tests only
Requires the dev server to be running on port 3000:
```bash
npm run dev  # In one terminal
npm run test:e2e -- puppeteer.e2e  # In another terminal
```

## Configuration

- `jest-puppeteer.config.js` - Puppeteer launch options and server configuration
- `jest.e2e.config.js` - Jest configuration for E2E tests

## What the Tests Check

### Basic Functionality Tests
- Browser and page creation
- Navigation to URLs
- Page content retrieval
- JavaScript execution in page context
- Page metrics collection
- Viewport manipulation
- Multiple page handling

### Next.js App Tests
- Page loading and title verification
- Image rendering
- HTTP response status
- Viewport dimensions
- Screenshot capture
- Content verification
- JavaScript evaluation
- DOM interactions

## Troubleshooting

If tests fail:
1. Ensure the dev server is running for app-specific tests
2. Check that port 3000 is not in use by another process
3. Verify Puppeteer can launch Chrome/Chromium on your system
4. Check the console output for specific error messages
