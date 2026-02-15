import { authLib } from '../auth';
import Cookies from 'js-cookie';

// Mock js-cookie
jest.mock('js-cookie');

describe('authLib', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setToken', () => {
    it('should set token in cookie with correct options', () => {
      const token = 'test-token';
      authLib.setToken(token);

      expect(Cookies.set).toHaveBeenCalledWith('cronny_auth_token', token, {
        expires: 7,
        sameSite: 'strict',
        secure: false, // test environment
      });
    });
  });

  describe('getToken', () => {
    it('should return token from cookie', () => {
      const token = 'test-token';
      (Cookies.get as jest.Mock).mockReturnValue(token);

      const result = authLib.getToken();

      expect(Cookies.get).toHaveBeenCalledWith('cronny_auth_token');
      expect(result).toBe(token);
    });

    it('should return undefined if no token', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);

      const result = authLib.getToken();

      expect(result).toBeUndefined();
    });
  });

  describe('removeToken', () => {
    it('should remove token from cookie', () => {
      authLib.removeToken();

      expect(Cookies.remove).toHaveBeenCalledWith('cronny_auth_token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      (Cookies.get as jest.Mock).mockReturnValue('test-token');

      const result = authLib.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no token', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);

      const result = authLib.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove token', () => {
      authLib.logout();

      expect(Cookies.remove).toHaveBeenCalledWith('cronny_auth_token');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should call login API and set token on success', async () => {
      const mockToken = 'test-token';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token: mockToken }),
      });

      const result = await authLib.login('test@example.com', 'password');

      expect(global.fetch).toHaveBeenCalledWith('/api/cronny/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });

      expect(Cookies.set).toHaveBeenCalledWith('cronny_auth_token', mockToken, expect.any(Object));
      expect(result).toEqual({ success: true, token: mockToken });
    });

    it('should return error on failed login', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      const result = await authLib.login('test@example.com', 'wrong-password');

      expect(result).toEqual({ success: false, error: 'Invalid credentials' });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await authLib.login('test@example.com', 'password');

      expect(result).toEqual({ success: false, error: 'Network error. Please try again.' });
    });
  });
});
