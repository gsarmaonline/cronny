# Puppeteer E2E Tests

This directory contains end-to-end tests using Puppeteer for the Cronny UI.

## Test Files

- `puppeteer-basic.e2e.test.ts` - Basic Puppeteer functionality tests (standalone, no dev server needed)
- `puppeteer.e2e.test.ts` - Next.js application E2E tests (requires dev server)

## Running Tests

### Run all E2E tests (optimized)
```bash
npm run test:e2e
```
This runs basic tests first (no server), then app tests (with server).

### Run only basic Puppeteer tests (fast - no dev server needed)
```bash
npm run test:e2e:basic
```
Tests: puppeteer-basic, puppeteer-screenshots, puppeteer-pdf

### Run only Next.js app tests (requires dev server)
```bash
npm run test:e2e:app
```
Tests: puppeteer.e2e (app-specific tests with dev server)

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
