import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GithubIcon, FileIcon as GoogleIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const SSOButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  provider: string;
  onClick: (provider: string) => void;
}> = ({ icon, label, provider, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(provider)}
    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {icon}
    <span>{label}</span>
  </button>
);

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, ssoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: string) => {
    setError('');
    setIsLoading(true);

    try {
      await ssoLogin(provider);
      navigate('/');
    } catch (err) {
      setError(`Failed to authenticate with ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Sentry Academy</h1>
        <p className="text-gray-600 mt-2">Sign in to continue learning</p>
      </div>

      <div className="space-y-4 mb-6">
        <SSOButton
          icon={<GoogleIcon size={20} />}
          label="Continue with Google"
          provider="google"
          onClick={handleSSO}
        />
        <SSOButton
          icon={<GithubIcon size={20} />}
          label="Continue with Github"
          provider="github"
          onClick={handleSSO}
        />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="•••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="#" className="font-medium text-blue-600 hover:text-blue-800">
          Create one now
        </a>
      </p>
    </div>
  );
};

export default LoginForm;