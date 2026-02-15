/// <reference types="jest-puppeteer" />

describe('Puppeteer Basic Functionality', () => {
  it('should launch browser and create page', async () => {
    expect(browser).toBeTruthy()
    expect(page).toBeTruthy()
  })

  it('should navigate to a URL', async () => {
    await page.goto('https://example.com')
    const url = page.url()
    expect(url).toContain('example.com')
  })

  it('should get page content', async () => {
    await page.goto('https://example.com')
    const content = await page.content()
    expect(content).toContain('Example Domain')
  })

  it('should execute JavaScript', async () => {
    await page.goto('https://example.com')
    const title = await page.evaluate(() => document.title)
    expect(title).toBe('Example Domain')
  })

  it('should handle page metrics', async () => {
    await page.goto('https://example.com')
    const metrics = await page.metrics()

    expect(metrics).toHaveProperty('Timestamp')
    expect(metrics).toHaveProperty('Documents')
    expect(metrics).toHaveProperty('Frames')
    expect(metrics.Documents).toBeGreaterThan(0)
  })

  it('should set viewport', async () => {
    await page.setViewport({ width: 1280, height: 720 })
    const viewport = page.viewport()

    expect(viewport?.width).toBe(1280)
    expect(viewport?.height).toBe(720)
  })

  it('should get browser version', async () => {
    const version = await browser.version()
    expect(version).toBeTruthy()
    expect(typeof version).toBe('string')
  })

  it('should create and close new page', async () => {
    const newPage = await browser.newPage()
    expect(newPage).toBeTruthy()

    await newPage.goto('https://example.com')
    const url = newPage.url()
    expect(url).toContain('example.com')

    await newPage.close()
  })
})
