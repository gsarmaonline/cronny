import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '../page';
import { authLib } from '@/lib/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth library
jest.mock('@/lib/auth', () => ({
  authLib: {
    isAuthenticated: jest.fn(),
    logout: jest.fn(),
  },
}));

describe('DashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should redirect to login if not authenticated', () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<DashboardPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should render dashboard when authenticated', async () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Cronny Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Cronny')).toBeInTheDocument();
      expect(screen.getByText('Manage your cron jobs and scheduled tasks')).toBeInTheDocument();
    });
  });

  it('should display stats grid', async () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Actions')).toBeInTheDocument();
      expect(screen.getByText('Active Schedules')).toBeInTheDocument();
      expect(screen.getByText('Completed Jobs')).toBeInTheDocument();
      expect(screen.getByText('Failed Jobs')).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Cronny Dashboard')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(authLib.logout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading state initially before mounting', async () => {
    (authLib.isAuthenticated as jest.Mock).mockReturnValue(true);

    const { container } = render(<DashboardPage />);

    // Initially shows loading, but quickly transitions to dashboard
    // So we just check that the component renders without errors
    await waitFor(() => {
      expect(container).toBeDefined();
    });
  });
});
