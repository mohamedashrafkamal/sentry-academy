import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProgress } from '../data/users';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Mail, Clock, BookOpen, Award, Calendar } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  const progress = getUserProgress(user.id);
  const totalCoursesStarted = progress.length;
  const totalLessonsCompleted = progress.reduce(
    (total, course) => total + course.completedLessons.length, 
    0
  );
  
  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">
          Manage your account and view your learning progress
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile info */}
        <div>
          <Card className="mb-6">
            <CardHeader className="flex flex-col items-center pb-2">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                <Button 
                  variant="outline" 
                  fullWidth 
                  leftIcon={<User size={16} />}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth 
                  leftIcon={<Mail size={16} />}
                >
                  Change Email
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-gray-900">Account Information</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <p>May 15, 2025</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <div className="flex items-center mt-1">
                    <Award className="h-4 w-4 text-blue-500 mr-2" />
                    <p>Premium Member</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Learning Stats */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <h3 className="font-semibold text-gray-900">Learning Statistics</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 mb-2">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalCoursesStarted}</p>
                  <p className="text-sm text-gray-600">Courses Started</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 mb-2">
                    <Award className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalLessonsCompleted}</p>
                  <p className="text-sm text-gray-600">Lessons Completed</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-purple-600 mb-2">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">12h 30m</p>
                  <p className="text-sm text-gray-600">Learning Time</p>
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Started "Advanced Error Tracking"</p>
                    <p className="text-sm text-gray-600">Yesterday at 2:30 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Completed "Introduction to Observability"</p>
                    <p className="text-sm text-gray-600">3 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-2 rounded-full mr-3">
                    <BookOpen className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Added "Log Analysis" to favorites</p>
                    <p className="text-sm text-gray-600">5 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <h3 className="font-semibold text-gray-900">Achievements</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900">First Course</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                
                <div className="text-center opacity-50">
                  <div className="bg-gray-100 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900">Course Master</p>
                  <p className="text-sm text-gray-600">Locked</p>
                </div>
                
                <div className="text-center opacity-50">
                  <div className="bg-gray-100 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900">10 Hour Club</p>
                  <p className="text-sm text-gray-600">Locked</p>
                </div>
                
                <div className="text-center opacity-50">
                  <div className="bg-gray-100 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900">Social Learner</p>
                  <p className="text-sm text-gray-600">Locked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;