import * as fs from 'fs'
import * as path from 'path'

describe('Puppeteer PDF Generation Tests', () => {
  const pdfsDir = path.join(__dirname, '../pdfs')

  beforeAll(() => {
    // Create pdfs directory if it doesn't exist
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true })
    }
  })

  it('should generate a PDF from a webpage', async () => {
    await page.goto('https://example.com', { waitUntil: 'networkidle2' })
    const pdfPath = path.join(pdfsDir, 'example.pdf')

    await page.pdf({
      path: pdfPath,
      format: 'A4',
    })

    expect(fs.existsSync(pdfPath)).toBe(true)
    const stats = fs.statSync(pdfPath)
    expect(stats.size).toBeGreaterThan(0)
  })

  it('should generate a PDF with custom margins', async () => {
    await page.goto('https://example.com', { waitUntil: 'networkidle2' })
    const pdfPath = path.join(pdfsDir, 'custom-margins.pdf')

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })

    expect(fs.existsSync(pdfPath)).toBe(true)
  })

  it('should generate a PDF in landscape mode', async () => {
    await page.goto('https://example.com', { waitUntil: 'networkidle2' })
    const pdfPath = path.join(pdfsDir, 'landscape.pdf')

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
    })

    expect(fs.existsSync(pdfPath)).toBe(true)
  })

  it('should return PDF as buffer', async () => {
    await page.goto('https://example.com', { waitUntil: 'networkidle2' })
    const pdfData = await page.pdf({ format: 'A4' })

    // Puppeteer returns Uint8Array
    expect(pdfData instanceof Uint8Array).toBe(true)
    expect(pdfData.length).toBeGreaterThan(0)
  })

  it('should generate a PDF with header and footer', async () => {
    await page.goto('https://example.com', { waitUntil: 'networkidle2' })
    const pdfPath = path.join(pdfsDir, 'with-header-footer.pdf')

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Page Header</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: {
        top: '40mm',
        bottom: '40mm',
      },
    })

    expect(fs.existsSync(pdfPath)).toBe(true)
  })
})
