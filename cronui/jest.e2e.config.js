module.exports = {
  preset: 'jest-puppeteer',
  testRegex: './*\\.e2e\\.test\\.(js|ts)$',
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
