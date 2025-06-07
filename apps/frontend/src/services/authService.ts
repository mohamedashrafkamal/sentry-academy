const API_BASE_URL = 'http://localhost:3001/api/auth';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: any;
  token: string;
  expiresIn: string;
  warnings?: string[];
}

export interface SSORequest {
  code?: string;
  state?: string;
}

export interface AuthError {
  error: string;
  message: string;
  code?: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  }

  async ssoLogin(provider: string, ssoData: SSORequest = {}): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/sso/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ssoData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `${provider} login failed`);
    }

    return data;
  }

  async logout(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Logout failed');
    }
  }
}

export const authService = new AuthService();