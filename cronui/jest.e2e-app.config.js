module.exports = {
  preset: 'jest-puppeteer',
  testRegex: 'puppeteer\\.e2e\\.test\\.(js|ts)$', // Only app-specific tests
  testTimeout: 30000,
  setupFilesAfterEnv: ['./jest-puppeteer-app.config.js'],
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
