import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  ssoLogin: (provider: string, jwtToken?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call the real backend authentication endpoint
      const response = await authService.login({ email, password });
      
      console.log('Login response received:', { 
        hasUser: !!response.user,
        hasWarnings: !!response.warnings
      });

      // BUG: Frontend assumes backend always returns complete user data
      // This will throw errors that Sentry will automatically catch
      
      // BUG: Assume user always has preferences object (backend sometimes doesn't include it)
      const userTheme = response.user.preferences.theme; // Will throw: Cannot read property 'theme' of undefined
      
      // BUG: Assume user always has settings with nested email config (backend uses inconsistent structure)
      const emailNotifications = response.user.settings.email.notifications; // Wrong property path from backend
      
      // BUG: Try to access metadata that might be missing or have different structure
      const lastLoginDate = response.user.metadata.lastLogin; // Backend inconsistent with this field
      
      // BUG: Assume social profiles array always exists and has specific structure
      const socialAvatars = response.user.socialProfiles.map((profile: any) => ({
        provider: profile.provider,
        avatar: profile.avatar || profile.profileImage, // Backend inconsistent naming
        verified: profile.verified
      }));

      // Construct user profile with assumptions about data structure
      const userProfile = {
        ...response.user,
        theme: userTheme || 'light',
        notifications: emailNotifications,
        lastLoginDate: lastLoginDate,
        socialAvatars: socialAvatars,
        // BUG: Add derived properties that assume nested structures exist
        displaySettings: {
          showNotifications: response.user.settings.privacy.notifications, // Nested path that may not exist
          privacyLevel: response.user.settings.privacy.level // Backend structure inconsistency
        }
      };

      setUser(userProfile);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('authToken', response.token);
      
      console.log('Login successful');

    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Clear any partial state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Re-throw the error so Sentry can catch it automatically
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const ssoLogin = async (provider: string, jwtToken?: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // BUG: Frontend team assumes they need to send a JWT token
      // But they generate it incorrectly and don't actually send it
      const mockUserData = {
        email: `demo.user.${provider}@example.com`,
        name: `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        provider: provider,
        timestamp: new Date().toISOString()
      };

      console.log('Initiating SSO login with:', mockUserData);
      console.log('JWT token provided:', !!jwtToken);

      // BUG: Call SSO endpoint - will fail if JWT token is missing
      // This simulates a miscommunication where frontend thinks they're sending auth
      // but backend expects a different format
      const response = await authService.ssoLogin(provider, {
        userData: mockUserData,
        jwtToken: jwtToken, // Include the JWT token if provided
        code: 'mock-oauth-code',
        state: 'mock-state'
      });

      // This should not be reached if JWT token is missing
      console.log('SSO response received:', response);

      // BUG: If somehow we get here, try to process response that may be malformed
      // These property accesses will throw errors that Sentry will catch
      const ssoUserProfile = {
        ...response.user,
        authProvider: provider,
        socialProfile: response.user.socialProfile || null,
        linkedAccounts: response.user.linkedAccounts || [],
        avatar: response.user.avatar || 'https://via.placeholder.com/150',
        isVerified: response.user.verified || false,
        // BUG: Try to access JWT data that won't exist due to backend error
        jwtClaims: response.user.jwtClaims.sub, // Will throw error - Sentry will catch this
        tokenExpiry: response.user.jwtClaims.exp // Will throw error - Sentry will catch this
      };

      setUser(ssoUserProfile);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(ssoUserProfile));
      localStorage.setItem('authToken', response.token);
      
      console.log(`SSO login successful with ${provider}`);

    } catch (error: any) {
      console.error(`SSO login failed for ${provider}:`, error);
      
      // Clear any partial state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Re-throw the error so Sentry can catch it automatically
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      // Don't block logout on API error, but let error bubble up for Sentry
      console.warn('Logout API call failed:', error);
      // Don't re-throw here since logout should always succeed for UX
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      console.log('User logged out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        ssoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};