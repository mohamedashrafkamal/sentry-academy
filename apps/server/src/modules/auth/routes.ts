import express from 'express';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const authRoutes = express.Router();

// Mock user database - simulating inconsistent backend data
const mockUserProfiles: Record<string, any> = {
  'alex@example.com': {
    id: '1',
    email: 'alex@example.com',
    name: 'Alex Johnson',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    role: 'student',
    // BUG: This user profile is missing the 'preferences' object that frontend expects
    // preferences: { theme: 'light' }, // <-- This should exist but doesn't
    profile: {
      // BUG: inconsistent nesting - should be 'settings' but it's 'profile'
      notifications: true,
      // BUG: missing 'privacy' object that frontend code expects
    },
    // BUG: Missing 'metadata' object entirely
    social: {
      // BUG: Only partial social data - missing some providers
      google: {
        // BUG: missing 'avatar' property that SSO login expects
        verified: true
      }
      // BUG: missing 'github' object entirely
    }
  },
  'demo@example.com': {
    id: 'demo-user-id',
    email: 'demo@example.com',
    name: 'Demo User',
    role: 'student',
    preferences: {
      theme: 'dark'
      // BUG: missing other expected preference properties
    },
    // BUG: Different structure - has 'config' instead of 'settings'
    config: {
      email: {
        notifications: false
      }
      // BUG: missing 'privacy' nested object
    },
    metadata: {
      // BUG: missing 'lastLogin' property that frontend expects
      signupDate: '2025-01-15'
    }
  }
};

// Login endpoint - realistic backend authentication with data issues
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // BUG: Missing validation - this will cause errors if email/password not provided
    console.log(`Login attempt for email: ${email}`);
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // BUG: Poor error handling - will throw if email is undefined
    const userProfile = mockUserProfiles[email?.toLowerCase()];
    
    if (!userProfile) {
      console.warn(`Login failed - user not found: ${email}`);
      return res.status(401).json({
        error: 'AUTHENTICATION_FAILED',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // BUG: Simulate backend data inconsistency - trying to access missing properties
    try {
      // This will fail for users without proper metadata structure
      const lastLoginDate = userProfile.metadata?.lastLogin; // Will throw for some users
      
      // BUG: Assume all users have settings.email structure
      const emailNotifications = userProfile.settings?.email?.notifications; // Wrong property path
      
      // Construct response with missing data assumptions
      const responseData = {
        user: {
          ...userProfile,
          lastLoginTimestamp: lastLoginDate, // undefined for most users
          notifications: emailNotifications,  // will cause errors
          // BUG: Add data that assumes nested structures exist
          socialProfiles: Object.keys(userProfile.social || {}).map((provider: string) => ({
            provider,
            avatar: userProfile.social[provider]?.avatar, // Missing for most providers
            verified: userProfile.social[provider]?.verified
          }))
        },
        token: `mock-token-${createId()}`,
        expiresIn: '24h'
      };
      
      console.log(`Successful login for ${email}`);
      res.json(responseData);
      
    } catch (dataError) {
      // BUG: Backend data processing error - return partial response that will cause frontend issues
      console.error('Data processing error:', dataError);
      
      // Return incomplete user data that will cause frontend errors
      res.json({
        user: {
          ...userProfile,
          // BUG: Missing properties that frontend expects
          lastLoginTimestamp: null,
          // BUG: Inconsistent property names
          notificationSettings: undefined, // frontend expects 'notifications'
        },
        token: `mock-token-${createId()}`,
        expiresIn: '24h',
        // BUG: Add warning that frontend might not handle properly
        warnings: ['Some user profile data could not be loaded']
      });
    }
    
  } catch (error: any) {
    console.error('Login error:', error);
    
    // BUG: Generic error response that doesn't help with debugging
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service temporarily unavailable',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
});

// SSO login endpoint - realistic OAuth simulation with missing data issues
authRoutes.post('/sso/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.body; // OAuth callback parameters
    
    console.log(`SSO login attempt with ${provider}`);
    
    // Simulate OAuth provider response delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // BUG: Hardcoded response - doesn't actually validate OAuth
    if (!['google', 'github'].includes(provider!)) {
      return res.status(400).json({
        error: 'UNSUPPORTED_PROVIDER',
        message: `SSO provider '${provider}' is not supported`,
        supportedProviders: ['google', 'github']
      });
    }
    
    // Mock SSO user data - with intentional missing properties
    const ssoUserData: Record<string, any> = {
      google: {
        id: '1',
        email: 'alex@example.com',
        name: 'Alex Johnson',
        // BUG: Missing avatar URL that frontend expects
        // avatar: 'https://...',
        verified: true,
        // BUG: Missing social profile data structure
        oauth: {
          // BUG: Missing 'scopes' object that frontend tries to access
          provider: 'google',
          externalId: 'google-123456'
        }
      },
      github: {
        id: '1', 
        email: 'alex@example.com',
        name: 'Alex Johnson',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        verified: false,
        // BUG: Different data structure than Google
        social: {
          github: {
            username: 'alexjohnson',
            // BUG: missing 'avatar' property in nested structure
            verified: false
          }
        },
        // BUG: Missing 'accounts' object that frontend expects
      }
    };
    
    const userData = ssoUserData[provider!];
    
    if (!userData) {
      return res.status(401).json({
        error: 'SSO_AUTH_FAILED',
        message: `Failed to authenticate with ${provider}`,
        provider
      });
    }
    
    try {
      // BUG: Try to construct response with assumptions about data structure
      const socialProfile = {
        profileImage: userData.social?.[provider!]?.avatar, // Will fail for Google
        verified: userData.social?.[provider!]?.verified,   // Will fail for Google  
        permissions: userData.oauth?.scopes?.[provider!]?.permissions // Will fail - nested missing
      };
      
      // BUG: Try to map linked accounts that don't exist
      const linkedAccounts = userData.accounts?.linked?.map((account: any) => ({
        provider: account.provider,
        externalId: account.id
      })) || [];
      
      const responseData = {
        user: {
          ...userData,
          role: 'student',
          socialProfile,
          linkedAccounts,
          authProvider: provider
        },
        token: `sso-token-${createId()}`,
        expiresIn: '24h'
      };
      
      console.log(`Successful SSO login with ${provider}`);
      res.json(responseData);
      
    } catch (dataError) {
      // BUG: Send partial response that will cause frontend issues
      console.error('SSO data processing error:', dataError);
      
      res.json({
        user: {
          ...userData,
          role: 'student',
          authProvider: provider,
          // BUG: Missing expected SSO-specific properties
          socialProfile: null,
          linkedAccounts: []
        },
        token: `sso-token-${createId()}`,
        expiresIn: '24h',
        warnings: [`Some ${provider} profile data unavailable`]
      });
    }
    
  } catch (error: any) {
    console.error('SSO login error:', error);
    
    res.status(500).json({
      error: 'SSO_SERVICE_ERROR', 
      message: `${req.params.provider} authentication service error`,
      provider: req.params.provider
    });
  }
});

// Logout endpoint
authRoutes.post('/logout', async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real app, would invalidate the token
    console.log('User logout');
    
    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'LOGOUT_FAILED',
      message: 'Failed to logout'
    });
  }
});