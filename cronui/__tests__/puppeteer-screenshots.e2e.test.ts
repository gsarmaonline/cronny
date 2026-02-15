import * as fs from 'fs'
import * as path from 'path'

describe('Puppeteer Screenshot Tests', () => {
  const screenshotsDir = path.join(__dirname, '../screenshots')

  beforeAll(() => {
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
  })

  it('should capture a full page screenshot', async () => {
    await page.goto('https://example.com')
    const screenshotPath = path.join(screenshotsDir, 'full-page.png')

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    })

    expect(fs.existsSync(screenshotPath)).toBe(true)
    const stats = fs.statSync(screenshotPath)
    expect(stats.size).toBeGreaterThan(0)
  })

  it('should capture a screenshot of a specific element', async () => {
    await page.goto('https://example.com')
    const element = await page.$('h1')

    if (element) {
      const screenshotPath = path.join(screenshotsDir, 'element.png')
      await element.screenshot({ path: screenshotPath })

      expect(fs.existsSync(screenshotPath)).toBe(true)
      const stats = fs.statSync(screenshotPath)
      expect(stats.size).toBeGreaterThan(0)
    }
  })

  it('should capture screenshots at different viewport sizes', async () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ]

    for (const viewport of viewports) {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
      })

      await page.goto('https://example.com')
      const screenshotPath = path.join(
        screenshotsDir,
        `${viewport.name}-${viewport.width}x${viewport.height}.png`
      )

      await page.screenshot({ path: screenshotPath })

      expect(fs.existsSync(screenshotPath)).toBe(true)
    }
  })

  it('should return screenshot as buffer', async () => {
    await page.goto('https://example.com')
    const buffer = await page.screenshot()

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should capture screenshot in different formats', async () => {
    await page.goto('https://example.com')

    // PNG format
    const pngPath = path.join(screenshotsDir, 'format-test.png')
    await page.screenshot({ path: pngPath, type: 'png' })
    expect(fs.existsSync(pngPath)).toBe(true)

    // JPEG format
    const jpegPath = path.join(screenshotsDir, 'format-test.jpeg')
    await page.screenshot({ path: jpegPath, type: 'jpeg', quality: 90 })
    expect(fs.existsSync(jpegPath)).toBe(true)
  })
})
