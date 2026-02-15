import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Home from '../page'
import { authLib } from '@/lib/auth'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth library
jest.mock('@/lib/auth', () => ({
  authLib: {
    isAuthenticated: jest.fn(),
  },
}))

describe('Home Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('redirects to dashboard when authenticated', () => {
    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(true)

    render(<Home />)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to login when not authenticated', () => {
    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(false)

    render(<Home />)

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('shows loading state', () => {
    ;(authLib.isAuthenticated as jest.Mock).mockReturnValue(false)

    render(<Home />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
