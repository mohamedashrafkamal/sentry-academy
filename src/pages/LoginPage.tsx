import React from 'react';
import { Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left side - form */}
        <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <GraduationCap className="h-10 w-10 text-blue-600" />
                <h1 className="ml-2 text-2xl font-bold text-gray-900">
                  Sentry Academy
                </h1>
              </div>
            </div>
            
            <LoginForm />
          </div>
        </div>
        
        {/* Right side - image and copy */}
        <div className="hidden md:block md:w-1/2 bg-blue-700 text-white">
          <div className="h-full flex items-center">
            <div className="p-16">
              <h2 className="text-3xl font-bold mb-6">Master the Art of Observability</h2>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands of developers learning advanced software development techniques.
              </p>
              
              <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
                <p className="italic text-blue-50 mb-4">
                  "Sentry Academy has been instrumental in helping our team implement 
                  robust observability practices. The courses are practical and directly 
                  applicable to our daily work."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" 
                    alt="User testimonial" 
                    className="w-10 h-10 rounded-full mr-3 object-cover" 
                  />
                  <div>
                    <p className="font-medium">Michael Chen</p>
                    <p className="text-sm text-blue-200">Senior Developer at TechCorp</p>
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