// Ensure we use the basic config (no server)
process.env.JEST_PUPPETEER_CONFIG = require.resolve('./jest-puppeteer.config.js');

module.exports = {
  preset: 'jest-puppeteer',
  testRegex: './*\\.e2e\\.test\\.(js|ts)$',
  testPathIgnorePatterns: [
    '/node_modules/',
    'puppeteer\\.e2e\\.test\\.ts$' // App tests run separately with dev server
  ],
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
