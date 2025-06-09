import express from 'express';
import { createId } from '@paralleldrive/cuid2';

export const authRoutes = express.Router();

// Simple mock user for email/password login
const mockUser = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'student',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  preferences: {
    theme: 'light',
  },
};

// @ts-expect-error - Express router type issue
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'MISSING_CREDENTIALS',
        message: 'Email and password are required',
      });
    }

    if (email === 'admin@sentry.io') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Admin access is not allowed. Please use the Admin portal.',
      });
    }

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For demo purposes, accept any email/password
    const responseData = {
      user: { ...mockUser, email },
      token: `token-${createId()}`,
      expiresIn: '24h',
    };

    console.log(`Successful login for ${email}`);
    res.json(responseData);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication service error',
    });
  }
});

authRoutes.post('/sso/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { loginSignature } = req.body;

    // TOFIX Module 1: SSO Login with missing login signature
    const signaturePayload = JSON.parse(atob(loginSignature)); // This will throw when loginSignature is undefined

    // Use the rich fake user data from the signature payload, with sensible defaults
    const fakeUserData = signaturePayload.userData || {};

    const ssoUser = {
      id: fakeUserData.id || createId(),
      email: fakeUserData.email || `${provider}.user@example.com`,
      name: fakeUserData.name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      firstName: fakeUserData.firstName || 'Demo',
      lastName: fakeUserData.lastName || 'User',
      username: fakeUserData.username || 'demo.user',
      avatar:
        fakeUserData.avatar ||
        'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      company: fakeUserData.company || 'Demo Company',
      jobTitle: fakeUserData.jobTitle || 'Software Developer',
      phone: fakeUserData.phone || '+1-555-0123',
      workEmail: fakeUserData.workEmail || fakeUserData.email,
      role: 'student',
      provider: provider,
      signatureClaims: {
        sub: signaturePayload.sub,
        exp: signaturePayload.exp,
        metadata: {
          permissions: [],
          roles: [],
        },
      },
      socialProfile: {
        profileImage:
          fakeUserData.avatar ||
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        verified: true,
        provider: provider,
        externalId: signaturePayload.sub,
        profile: {
          username: fakeUserData.username || (fakeUserData.email || signaturePayload.email || 'user').split('@')[0],
          avatar: fakeUserData.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
        }
      }]
    };

    const responseData = {
      user: ssoUser,
      token: `sso-token-${createId()}`,
      expiresIn: '24h',
    };

    res.json(responseData);
  } catch (error: any) {
    throw error;
  }
});

authRoutes.post('/logout', async (req, res) => {
  try {
    console.log('User logout');
    res.json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'LOGOUT_FAILED',
      message: 'Failed to logout',
    });
  }
});
