import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import * as Sentry from '@sentry/react';

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
        Sentry.captureException(error);
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
      
      Sentry.addBreadcrumb({
        message: 'Login response received',
        category: 'auth',
        level: 'info',
        data: { 
          hasUser: !!response.user,
          hasWarnings: !!response.warnings
        }
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
        
        Sentry.captureMessage('Login successful', 'info');

      } catch (dataProcessingError) {
        // BUG: Frontend data processing failed due to backend missing properties
        // This creates a realistic scenario where backend issues cause frontend errors
        Sentry.captureException(dataProcessingError);
        
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
      Sentry.captureException(error);
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
      // Simulate OAuth flow - in real app would handle OAuth redirect
      const response = await authService.ssoLogin(provider, {
        code: 'mock-oauth-code',
        state: 'mock-state'
      });

      Sentry.addBreadcrumb({
        message: `SSO login response received for ${provider}`,
        category: 'auth',
        level: 'info',
        data: { provider, hasUser: !!response.user }
      });

      // BUG: Frontend assumes SSO responses have consistent structure across providers
      try {
        // BUG: Assume all SSO providers return social profile data in the same format
        const socialProfile = {
          profileImage: response.user.socialProfile.profileImage, // May not exist for all providers
          verified: response.user.socialProfile.verified,
          permissions: response.user.socialProfile.permissions // Backend might not include this
        };

        // BUG: Assume linked accounts array always exists and is populated
        const linkedAccounts = response.user.linkedAccounts.map((account: any) => ({
          provider: account.provider,
          externalId: account.externalId,
          // BUG: Assume additional properties that backend might not provide
          username: account.profile.username, // Nested property that may not exist
          avatar: account.profile.avatar
        }));

        // BUG: Different assumption about user avatar source for SSO vs regular login
        const avatarUrl = response.user.avatar || 
                         response.user.socialProfile.profileImage || 
                         response.user.social[provider].avatar; // Multiple fallback paths that may fail

        const ssoUserProfile = {
          ...response.user,
          authProvider: provider,
          socialProfile: socialProfile,
          linkedAccounts: linkedAccounts,
          avatar: avatarUrl,
          // BUG: SSO-specific properties that might not be in response
          isVerified: response.user.verified || response.user.social[provider].verified,
          // BUG: OAuth-specific data that backend might structure differently
          oauthTokens: {
            accessToken: response.user.oauth.accessToken, // Nested path that may not exist
            refreshToken: response.user.oauth.refreshToken,
            scope: response.user.oauth.scopes[provider].join(' ') // Array manipulation on missing data
          }
        };

        setUser(ssoUserProfile);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(ssoUserProfile));
        localStorage.setItem('authToken', response.token);
        
        Sentry.captureMessage(`SSO login successful with ${provider}`, 'info');

      } catch (ssoDataError) {
        // BUG: SSO data processing failed due to backend inconsistencies
        Sentry.captureException(ssoDataError);
        
        console.error(`Failed to process ${provider} SSO data:`, ssoDataError);
        
        // Create fallback SSO profile but still attempt to access some missing properties
        const fallbackSSOProfile = {
          ...response.user,
          authProvider: provider,
          socialProfile: null,
          linkedAccounts: [],
          // BUG: Still try to derive avatar from potentially missing sources
          avatar: response.user.avatar || 'https://via.placeholder.com/150',
          isVerified: false,
          // BUG: Add incomplete OAuth data
          oauthTokens: null,
          ssoIncomplete: true,
          ssoWarnings: response.warnings || [`${provider} profile data incomplete`]
        };

        setUser(fallbackSSOProfile);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(fallbackSSOProfile));
        localStorage.setItem('authToken', response.token);
        
        throw new Error(`${provider} login successful but some account data could not be loaded. Social features may be limited.`);
      }

    } catch (error: any) {
      Sentry.captureException(error);
      console.error(`SSO login failed for ${provider}:`, error);
      
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

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      // Don't block logout on API error
      console.warn('Logout API call failed:', error);
      Sentry.captureException(error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      Sentry.captureMessage('User logged out', 'info');
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