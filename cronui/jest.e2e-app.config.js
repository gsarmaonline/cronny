// Use JEST_PUPPETEER_CONFIG env var to point to the app config
process.env.JEST_PUPPETEER_CONFIG = require.resolve('./jest-puppeteer-app.config.js');

module.exports = {
  preset: 'jest-puppeteer',
  testRegex: 'puppeteer\\.e2e\\.test\\.(js|ts)$', // Only app-specific tests
  testTimeout: 30000,
  globals: {
    URL: 'http://localhost:3000',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
  testEnvironment: 'jest-environment-puppeteer',
}
