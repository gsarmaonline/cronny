# Cronny UI

This is the web frontend for the Cronny job scheduling system. It's built with React, TypeScript, and Material UI.

## Features

- JWT Authentication with login and registration
- Dashboard with system statistics
- Job management interface
- Schedule management interface
- Material UI based responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

### Development

1. Make sure the Cronny backend API is running on port 8009
2. Start the development server:

```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

By default, the UI connects to the backend at `http://localhost:8009`. This is configured in two places:

1. In `package.json` via the `proxy` field (for development)
2. In `src/services/api.ts` via the `API_URL` constant (for production)

### Building for Production

```bash
npm run build
```

This creates a production-ready build in the `build` folder.

## Project Structure

- `/src/components` - React components
  - `/auth` - Authentication components (Login, Register)
  - `/layout` - Layout components (MainLayout, Navbar)
  - `/jobs` - Job-related components
  - `/schedules` - Schedule-related components
- `/src/services` - API services
- `/src/contexts` - React contexts (AuthContext)
- `/src/utils` - Utility functions

## Authentication

The UI uses JWT tokens for authentication. When a user logs in or registers, a JWT token is obtained from the backend and stored in localStorage. This token is then included in the headers of subsequent API requests.

## Technologies Used

- React
- TypeScript
- Material UI
- React Router
- Axios