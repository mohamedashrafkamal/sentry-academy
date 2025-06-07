import React, { createContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getUserById } from '../data/users';

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
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // This is a mock implementation
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate a successful login with the first user
      const loggedInUser = getUserById('1');

      if (loggedInUser) {
        // BUG: Poorly written code that assumes user object structure
        // This simulates real-world scenarios where backend data changes
        // or frontend makes assumptions about data structure
        
        // BUG: Assume user always has metadata object with required fields
        const userMetadata = (loggedInUser as any).metadata;
        const lastLogin = userMetadata.lastLogin; // This will throw: Cannot read property 'lastLogin' of undefined
        
        // BUG: Assume user always has settings with nested email config
        const emailSettings = (loggedInUser as any).settings.email;
        const notificationEnabled = emailSettings.notifications; // This will throw: Cannot read property 'email' of undefined

        const userProfile = {
          ...loggedInUser,
          // This part works fine
          theme: (loggedInUser as any).preferences?.theme || 'light',
          // These will cause the failure
          lastLoginDate: lastLogin,
          settings: {
            notifications: notificationEnabled,
            privacy: (loggedInUser as any).settings.privacy.level
          }
        };

        setUser(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userProfile));
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const ssoLogin = async (provider: string): Promise<void> => {
    setIsLoading(true);
    try {
      // This is a mock implementation
      // In a real app, this would redirect to the SSO provider
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate a successful SSO login with the first user
      const loggedInUser = getUserById('1');

      if (loggedInUser) {
        // BUG: Different data structure assumptions for SSO vs regular login
        // This simulates inconsistent data handling between auth methods
        const ssoUserProfile = {
          ...loggedInUser,
          // SSO provider might return different data structure
          provider: provider,
          // This will throw "Cannot read property 'avatar' of undefined"
          socialProfile: {
            profileImage: (loggedInUser as any).social[provider].avatar,
            verified: (loggedInUser as any).social[provider].verified,
            // This will throw "Cannot read property 'scopes' of undefined"
            permissions: (loggedInUser as any).oauth.scopes[provider].permissions
          },
          // This will throw "Cannot read property 'map' of undefined"
          linkedAccounts: (loggedInUser as any).accounts.linked.map((account: any) => ({
            provider: account.provider,
            externalId: account.id
          }))
        };

        setUser(ssoUserProfile);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(ssoUserProfile));
      } else {
        throw new Error('SSO authentication failed');
      }
    } catch (error) {
      console.error('SSO login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
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