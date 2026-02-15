import Cookies from 'js-cookie';

const TOKEN_KEY = 'cronny_auth_token';
const TOKEN_EXPIRY_DAYS = 7;

export const authLib = {
  // Set auth token in cookie
  setToken: (token: string): void => {
    Cookies.set(TOKEN_KEY, token, {
      expires: TOKEN_EXPIRY_DAYS,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
  },

  // Get auth token from cookie
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  // Remove auth token
  removeToken: (): void => {
    Cookies.remove(TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!Cookies.get(TOKEN_KEY);
  },

  // Login with credentials
  login: async (email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const response = await fetch('/api/cronny/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        authLib.setToken(data.token);
        return { success: true, token: data.token };
      }

      return { success: false, error: data.message || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  // Logout
  logout: (): void => {
    authLib.removeToken();
  },
};
