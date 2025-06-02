import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProgress } from '../data/users';
import { getCourseById } from '../data/courses';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Progress } from '../types';
import { Clock, BookOpen, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LessonPlanItem: React.FC<{
  progress: Progress;
}> = ({ progress }) => {
  const navigate = useNavigate();
  const course = getCourseById(progress.courseId);
  
  if (!course) return null;
  
  const totalLessons = course.lessons.length;
  const completedCount = progress.completedLessons.length;
  const percentComplete = (completedCount / totalLessons) * 100;
  
  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow" onClick={handleClick} hoverEffect>
      <CardHeader className="pb-4">
        <h3 className="font-semibold text-lg text-gray-900">{course.title}</h3>
        <p className="text-sm text-gray-600">By {course.instructor}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span className="text-gray-700">Progress</span>
            <span className="font-medium">{Math.round(percentComplete)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            <span>
              {completedCount} of {totalLessons} lessons
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.duration}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LessonPlansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  let progressData: Progress[] = [];
  
  if (user) {
    progressData = getUserProgress(user.id);
  }
  
  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Plans</h1>
        <p className="text-gray-600">
          Track your progress across all your courses
        </p>
      </div>
      
      {progressData.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">No lesson plans yet</h2>
          <p className="text-gray-600 mb-6">
            Start a course to create your personalized lesson plan.
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center mx-auto"
            onClick={() => navigate('/courses')}
          >
            <BookOpen size={18} className="mr-2" />
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progressData.map((progress) => (
            <LessonPlanItem 
              key={progress.courseId} 
              progress={progress} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonPlansPage;