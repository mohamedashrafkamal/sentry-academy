import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  ssoLogin: (provider: string) => Promise<void>;
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
      // This is where realistic frontend errors occur based on backend's missing properties
      try {
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
          // These will work fine when data exists
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

      } catch (dataProcessingError) {
        // BUG: Frontend data processing failed due to backend missing properties
        // This creates a realistic scenario where backend issues cause frontend errors
        console.error('Failed to process user profile data:', dataProcessingError);
        
        // Create a minimal user profile with safe defaults, but still try to access some missing properties
        const fallbackProfile = {
          ...response.user,
          theme: 'light',
          notifications: true,
          lastLoginDate: new Date().toISOString(),
          // BUG: Still try to access properties that might not exist
          socialAvatars: [],
          displaySettings: {
            showNotifications: response.user.notificationSettings || false, // Backend sends this with wrong name
            privacyLevel: 'standard'
          },
          // BUG: Add warning info that frontend might not handle properly
          profileIncomplete: true,
          missingData: response.warnings || ['Some profile data unavailable']
        };

        setUser(fallbackProfile);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(fallbackProfile));
        localStorage.setItem('authToken', response.token);
        
        // Show a user-visible error about incomplete profile
        throw new Error('Login successful but some profile data could not be loaded. Please check your account settings.');
      }

    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Clear any partial state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const ssoLogin = async (provider: string): Promise<void> => {
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
      console.log('JWT token was generated but not sent to backend');

      // BUG: Call SSO endpoint without the JWT token that backend expects
      // This simulates a miscommunication where frontend thinks they're sending auth
      // but backend expects a different format
      const response = await authService.ssoLogin(provider, {
        userData: mockUserData,
        // BUG: Missing 'jwtToken' field that backend expects
        // jwtToken: generatedJWT, // <-- This is what backend expects but frontend doesn't send
        code: 'mock-oauth-code',
        state: 'mock-state'
      });

      // This should not be reached due to backend error
      console.log('SSO response received:', response);

      // BUG: If somehow we get here, try to process response that may be malformed
      const ssoUserProfile = {
        ...response.user,
        authProvider: provider,
        // BUG: Backend error response might not have expected structure
        socialProfile: response.user.socialProfile || null,
        linkedAccounts: response.user.linkedAccounts || [],
        avatar: response.user.avatar || 'https://via.placeholder.com/150',
        isVerified: response.user.verified || false,
        // BUG: Try to access JWT data that won't exist due to backend error
        jwtClaims: response.user.jwtClaims.sub, // Will throw error
        tokenExpiry: response.user.jwtClaims.exp // Will throw error
      };

      setUser(ssoUserProfile);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(ssoUserProfile));
      localStorage.setItem('authToken', response.token);
      
      console.log(`SSO login successful with ${provider}`);

    } catch (error: any) {
      console.error(`SSO login failed for ${provider}:`, error);
      
      // BUG: Frontend doesn't handle specific JWT validation errors properly
      if (error.message.includes('JWT') || error.message.includes('token')) {
        // This should help with debugging but might confuse users
        throw new Error(`Authentication failed: JWT token validation error. Please contact support if this issue persists. (Error: ${error.message})`);
      }
      
      // BUG: Generic error handling that doesn't give useful information
      throw new Error(`Unable to authenticate with ${provider}. The authentication service may be temporarily unavailable.`);
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
      // Don't block logout on API error
      console.warn('Logout API call failed:', error);
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