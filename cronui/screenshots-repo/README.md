# Page Screenshots

This directory contains reference screenshots of all pages in the Cronny UI application.

## Purpose

- **Documentation**: Visual reference of all pages in the app
- **Visual Regression Testing**: Detect unintended UI changes
- **Design Review**: Share UI updates with stakeholders
- **Onboarding**: Help new developers understand the app structure

## Structure

Screenshots are organized by page and viewport:

```
screenshots-repo/
├── home-desktop.png      # Home page at 1920x1080
├── home-tablet.png       # Home page at 768x1024
├── home-mobile.png       # Home page at 375x667
├── metadata.json         # Metadata about all screenshots
└── README.md            # This file
```

## Capturing Screenshots

### Prerequisites

Make sure the Next.js dev server is running:
```bash
npm run dev
```

### Capture All Pages

```bash
npm run capture-screenshots
```

This will:
1. Launch a headless browser
2. Navigate to each route defined in `scripts/capture-screenshots.js`
3. Capture screenshots at desktop, tablet, and mobile viewports
4. Save screenshots to this directory
5. Generate metadata.json with capture details

### Capture with Custom Base URL

```bash
BASE_URL=http://localhost:3001 npm run capture-screenshots
```

## When to Update Screenshots

Update screenshots when:
- ✅ Adding new pages to the application
- ✅ Making intentional UI changes
- ✅ Before creating a PR with frontend changes
- ✅ After merging major design updates

## Adding New Routes

Edit `scripts/capture-screenshots.js` and add to the `routes` array:

```javascript
{
  path: '/your-route',
  name: 'your-route',
  description: 'Description of the page'
}
```

## Viewport Sizes

Current viewports:
- **Desktop**: 1920x1080 (1x scale)
- **Tablet**: 768x1024 (2x scale)
- **Mobile**: 375x667 (2x scale)

Modify viewports in `scripts/capture-screenshots.js` if needed.

## Git Workflow

These screenshots are committed to the repository:
- Include in PRs when making UI changes
- Reviewers can see visual diffs in GitHub
- Provides historical record of UI evolution

## Metadata

`metadata.json` contains:
- Timestamp of last capture
- List of all routes and their screenshots
- Viewport configurations
- Total number of screenshots

## Troubleshooting

**Server not running**: Ensure `npm run dev` is running before capturing

**Timeout errors**: Increase timeout in script or check for slow-loading pages

**Missing pages**: Add the route to the `routes` array in the capture script
