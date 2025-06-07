import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, ssoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('demo.user@example.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleSSOLogin = async (provider: string) => {
    setError(null);
    
    try {
      // BUG: Frontend generates JWT token but doesn't send it initially
      // This simulates a common miscommunication where frontend team thinks they need to include JWT tokens
      // but doesn't actually send them to the backend properly
      
      // JWT token generation logic (that doesn't get sent!)
      const mockJwtPayload = {
        sub: `${provider}_user_123`,
        email: `demo.user.${provider}@example.com`,
        name: `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        provider: provider,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        aud: 'sentry-academy-app',
        iss: `${provider}-oauth-service`
      };

      // Generate a "JWT token" (mock format for demo purposes)
      const mockJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockJwtPayload))}.mock_signature_${Date.now()}`;
      
      console.log('Frontend generated JWT token:', mockJwtToken);
      console.log('JWT payload:', mockJwtPayload);
      
      // BUG: Comment out the token to simulate the miscommunication
      // await ssoLogin(provider, mockJwtToken); // This is what SHOULD happen
      
      // BUG: But instead, frontend doesn't send the token (simulating team miscommunication)
      await ssoLogin(provider); // Missing JWT token - backend will fail
      
    } catch (err: any) {
      // Let Sentry catch the error naturally by re-throwing it
      console.error(`SSO login with ${provider} failed:`, err);
      setError(err.message || `Failed to login with ${provider}`);
      // The error will be automatically captured by Sentry since it's unhandled
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Sentry Academy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Workshop: Debugging Authentication Issues
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Primary SSO Login Section */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Sign in with your organization
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleSSOLogin('google')}
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={() => handleSSOLogin('microsoft')}
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#F25022" d="M0 0h11v11H0z"/>
                <path fill="#7FBA00" d="M13 0h11v11H13z"/>
                <path fill="#00A4EF" d="M0 13h11v11H0z"/>
                <path fill="#FFB900" d="M13 13h11v11H13z"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Microsoft'}
            </button>

            <button
              type="button"
              onClick={() => handleSSOLogin('okta')}
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-5 h-5 mr-2 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              {isLoading ? 'Signing in...' : 'Continue with Okta'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or</span>
          </div>
        </div>

        {/* Email/Password Option (Hidden by default) */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="show-email-form"
              type="checkbox"
              checked={showEmailForm}
              onChange={(e) => setShowEmailForm(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="show-email-form" className="ml-2 block text-sm text-gray-900">
              Sign in with email and password
            </label>
          </div>

          {showEmailForm && (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Workshop Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-600">
            <strong>Workshop Mode:</strong> This demo simulates authentication issues between frontend and backend teams.
            Try the SSO login to see JWT token validation errors.
          </div>
        </div>
      </div>
    </div>
  );
};