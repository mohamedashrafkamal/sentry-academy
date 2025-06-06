import React from 'react';
import { Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - form */}
        <div className="w-full lg:w-1/2 p-8 flex items-center justify-center bg-white">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <GraduationCap className="h-10 w-10 text-purple-600" />
                <h1 className="ml-2 text-2xl font-bold text-gray-900">
                  Sentry Academy
                </h1>
              </div>
            </div>

            <LoginForm />
          </div>
        </div>

        {/* Right side - image and copy */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white">
          <div className="h-full flex items-center">
            <div className="p-16">
              <h2 className="text-3xl font-bold mb-6">Master the Art of Observability</h2>
              <p className="text-xl mb-8 text-purple-100">
                Join thousands of developers learning advanced software development techniques.
              </p>

              <div className="bg-black bg-opacity-20 backdrop-blur-sm border border-purple-400/20 p-6 rounded-lg">
                <p className="italic text-purple-50 mb-4">
                  "Sentry Academy has been instrumental in helping our team implement
                  robust observability practices. The courses are practical and directly
                  applicable to our daily work."
                </p>
                <div className="flex items-center">
                  <img
                    src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                    alt="User testimonial"
                    className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-purple-300"
                  />
                  <div>
                    <p className="font-medium text-white">Michael Chen</p>
                    <p className="text-sm text-purple-200">Senior Developer at TechCorp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;