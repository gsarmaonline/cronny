# Cronny UI

Frontend for the Cronny cron job manager, built with [Next.js](https://nextjs.org).

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Build

```bash
npm run build
```

Creates an optimized production build.

### Start Production Server

```bash
npm run start
```

Runs the production build locally.

## Testing

The project uses Jest and React Testing Library for testing.

### Run Tests

```bash
npm test
```

Run all tests once.

### Watch Mode

```bash
npm run test:watch
```

Run tests in watch mode for development.

### CI Mode

```bash
npm run test:ci
```

Run tests with coverage reporting (used in GitHub Actions).

## Project Structure

```
cronui/
├── src/
│   ├── app/
│   │   ├── __tests__/       # Test files
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   └── ...
├── public/                   # Static assets
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup (test utilities)
└── package.json
```

## Technologies

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Testing**: Jest + React Testing Library
- **Language**: TypeScript
- **Fonts**: [Geist](https://vercel.com/font) - optimized via `next/font`

## Code Quality

### Linting

```bash
npm run lint
```

## CI/CD

GitHub Actions automatically runs tests on:
- Pushes to main branch
- Pull requests to main branch
- Changes in the `cronui/` folder

Tests must pass before merging.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Feedback and contributions welcome
