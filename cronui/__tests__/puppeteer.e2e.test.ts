/// <reference types="jest-puppeteer" />

describe('Puppeteer E2E Tests', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
  })

  it('should display the page title', async () => {
    await expect(page.title()).resolves.toMatch('Cronny')
  })

  it('should have the Cronny heading', async () => {
    const heading = await page.$('h1')
    expect(heading).toBeTruthy()
    const text = await page.evaluate(el => el?.textContent, heading)
    expect(text).toContain('Cronny')
  })

  it('should navigate and load without errors', async () => {
    const response = await page.goto('http://localhost:3000')
    expect(response?.status()).toBe(200)
  })

  it('should have correct viewport dimensions', async () => {
    const dimensions = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        deviceScaleFactor: window.devicePixelRatio,
      }
    })

    expect(dimensions.width).toBeGreaterThan(0)
    expect(dimensions.height).toBeGreaterThan(0)
  })

  it('should take a screenshot', async () => {
    const screenshot = await page.screenshot()
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(0)
  })

  it('should find text content on the page', async () => {
    const content = await page.content()
    expect(content).toContain('Cronny')
  })

  it('should evaluate JavaScript in the page context', async () => {
    const result = await page.evaluate(() => {
      return navigator.userAgent
    })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('should handle page interactions', async () => {
    const links = await page.$$('a')
    expect(links.length).toBeGreaterThan(0)
  })
})
