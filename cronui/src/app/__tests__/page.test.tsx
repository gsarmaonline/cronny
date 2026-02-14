import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('To get started, edit the page.tsx file.')
  })

  it('renders the Next.js logo', () => {
    render(<Home />)
    const logo = screen.getByAltText('Next.js logo')
    expect(logo).toBeInTheDocument()
  })

  it('renders external links', () => {
    render(<Home />)
    const templatesLink = screen.getByText('Templates')
    const learningLink = screen.getByText('Learning')

    expect(templatesLink).toBeInTheDocument()
    expect(templatesLink).toHaveAttribute('href')
    expect(learningLink).toBeInTheDocument()
    expect(learningLink).toHaveAttribute('href')
  })

  it('renders the Deploy Now button', () => {
    render(<Home />)
    const deployButton = screen.getByText('Deploy Now')
    expect(deployButton).toBeInTheDocument()
    expect(deployButton.closest('a')).toHaveAttribute('target', '_blank')
    expect(deployButton.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the Documentation link', () => {
    render(<Home />)
    const docsLink = screen.getByText('Documentation')
    expect(docsLink).toBeInTheDocument()
    expect(docsLink.closest('a')).toHaveAttribute('target', '_blank')
  })
})
