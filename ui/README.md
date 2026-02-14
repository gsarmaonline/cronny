# UI - Puppeteer Scripts

This folder contains Puppeteer scripts for browser automation.

## Setup

Puppeteer is already installed. If you need to reinstall:

```bash
npm install
```

## Running the Example

Run the sample script:

```bash
npm start
```

Or directly:

```bash
node example.js
```

## What the Example Does

The `example.js` script demonstrates:
- Launching a browser (non-headless mode)
- Navigating to a webpage
- Getting the page title
- Taking a screenshot
- Extracting content from the page
- Closing the browser

## Headless Mode

To run in headless mode (no visible browser), edit `example.js` and change:

```javascript
headless: false  // Change to true
```

## Next Steps

Modify `example.js` or create new scripts for your automation needs!
