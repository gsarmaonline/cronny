import { metadata } from '../layout'

describe('RootLayout', () => {
  it('exports a default function', () => {
    // Layout component exists and can be imported
    const RootLayout = require('../layout').default
    expect(RootLayout).toBeDefined()
    expect(typeof RootLayout).toBe('function')
  })
})

describe('Metadata', () => {
  it('exports correct metadata', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('Cronny - Cron Job Manager')
    expect(metadata.description).toBe('Manage your cron jobs and scheduled tasks with Cronny')
  })
})
