import api from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GoogleLoginRequest {
  id_token: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/google', { id_token: idToken });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  }

  async register(registration: RegisterRequest): Promise<User> {
    const response = await api.post<AuthResponse>('/auth/register', registration);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();