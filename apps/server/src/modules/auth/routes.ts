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

// SSO login endpoint - expects JWT token that frontend doesn't send
authRoutes.post('/sso/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, userData, jwtToken } = req.body;
    
    console.log(`SSO login attempt with ${provider}`);
    console.log('Request body:', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasUserData: !!userData,
      hasJwtToken: !!jwtToken  // This will be false
    });
    
    // Simulate OAuth provider response delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // BUG: Backend expects JWT token that frontend doesn't send
    if (!jwtToken) {
      console.error(`JWT token missing for ${provider} SSO authentication`);
      return res.status(400).json({
        error: 'JWT_TOKEN_REQUIRED',
        message: 'JWT token is required for SSO authentication',
        code: 'MISSING_JWT_TOKEN',
        details: {
          provider: provider,
          expectedFields: ['jwtToken'],
          receivedFields: Object.keys(req.body),
          hint: 'Frontend must include a valid JWT token in the request body'
        }
      });
    }
    
    // BUG: If somehow a JWT token is provided, try to validate it incorrectly
    try {
      // This would normally parse and validate the JWT
      const jwtPayload = JSON.parse(atob(jwtToken));
      
      // BUG: Assume JWT has specific structure that might not exist
      const userEmail = jwtPayload.email; // Might not exist
      const userSub = jwtPayload.sub; // Might not exist  
      const jwtProvider = jwtPayload.provider; // Might not exist
      
      // BUG: Strict validation that will fail
      if (jwtProvider !== provider) {
        throw new Error('Provider mismatch in JWT token');
      }
      
      // BUG: Try to access nested claims that don't exist
      const userRoles = jwtPayload.claims.roles; // Will fail - no 'claims' object
      const permissions = jwtPayload.permissions.scopes; // Will fail - no 'permissions' object
      
    } catch (jwtError: any) {
      console.error('JWT validation failed:', jwtError);
      return res.status(401).json({
        error: 'JWT_VALIDATION_FAILED', 
        message: 'Invalid or malformed JWT token',
        code: 'INVALID_JWT',
        details: {
          jwtError: jwtError.message,
          provider: provider,
          hint: 'Ensure JWT token is properly formatted and contains required claims'
        }
      });
    }
    
    // This code should never be reached due to missing JWT token
    console.log('JWT validation passed - proceeding with SSO authentication');
    
    // Mock SSO user data that would be returned on successful auth
    const ssoUserData = {
      google: {
        id: '1',
        email: userData?.email || 'google.user@example.com',
        name: userData?.name || 'Google User',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        verified: true,
        provider: 'google'
      },
      github: {
        id: '1', 
        email: userData?.email || 'github.user@example.com',
        name: userData?.name || 'GitHub User',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        verified: true,
        provider: 'github'
      }
    };
    
    const authenticatedUser = ssoUserData[provider as keyof typeof ssoUserData];
    
    if (!authenticatedUser) {
      return res.status(400).json({
        error: 'UNSUPPORTED_PROVIDER',
        message: `SSO provider '${provider}' is not supported`,
        supportedProviders: ['google', 'github']
      });
    }
    
    // Return successful SSO response (this should not be reached)
    const responseData = {
      user: {
        ...authenticatedUser,
        role: 'student',
        // BUG: Backend assumes frontend can handle these JWT-specific fields
        jwtClaims: {
          sub: authenticatedUser.id,
          email: authenticatedUser.email,
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        socialProfile: {
          profileImage: authenticatedUser.avatar,
          verified: authenticatedUser.verified,
          provider: provider
        },
        linkedAccounts: [{
          provider: provider,
          externalId: authenticatedUser.id,
          profile: {
            username: authenticatedUser.email.split('@')[0],
            avatar: authenticatedUser.avatar
          }
        }]
      },
      token: `sso-token-${createId()}`,
      expiresIn: '24h'
    };
    
    console.log(`Successful SSO login with ${provider}`);
    res.json(responseData);
    
  } catch (error: any) {
    console.error('SSO login error:', error);
    
    // BUG: Catch-all error that doesn't provide specific information
    res.status(500).json({
      error: 'SSO_SERVICE_ERROR', 
      message: `${req.params.provider} authentication service encountered an error`,
      code: 'SSO_INTERNAL_ERROR',
      provider: req.params.provider,
      details: {
        timestamp: new Date().toISOString(),
        hint: 'Check server logs for more details'
      }
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