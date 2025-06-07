import React, { useState } from 'react';
import { Star, Clock, Award, Plus, Check, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useUserState } from '../../hooks/useUserState';

interface CourseCardProps {
  course: Course;
  className?: string;
  showEnrollButton?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  className = '',
  showEnrollButton = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    isCourseFavorited, 
    isCourseEnrolled, 
    toggleFavorite, 
    enrollInCourse 
  } = useUserState();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const isEnrolled = isCourseEnrolled(course.id);
  const isFavorited = isCourseFavorited(course.id);

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user?.id) {
      alert('Please log in to favorite courses');
      return;
    }

    toggleFavorite(course);
  };

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!user?.id) {
      alert('Please log in to enroll in courses');
      return;
    }

    setIsEnrolling(true);
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      enrollInCourse(course);
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('Failed to enroll in the course. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <Card
      className={`h-full transition-all duration-300 hover:shadow-md ${className}`}
      hoverEffect
      onClick={handleClick}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        {course.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="primary" size="sm">Featured</Badge>
          </div>
        )}
        
        {/* Favorite Heart Icon */}
        <button
          onClick={handleFavoriteToggle}
          className={`absolute top-2 left-2 p-2 rounded-full transition-all duration-200 ${
            isFavorited 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart 
            className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`}
          />
        </button>
      </div>

      <CardContent className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{course.title}</h3>
            <p className="text-sm text-gray-600 mt-1">By {course.instructor}</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between text-sm pt-2">
          <div className="flex items-center text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="ml-1 font-medium">{course.rating}</span>
            <span className="ml-1 text-gray-500">({course.reviewCount})</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="ml-1">{course.duration}</span>
          </div>

          <div className="flex items-center">
            <Badge
              variant={getLevelBadgeVariant(course.level)}
              size="sm"
              className="flex items-center"
            >
              <Award className="h-3 w-3 mr-1" />
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </Badge>
          </div>
        </div>

        {showEnrollButton && (
          <div className="pt-3 border-t border-gray-100">
            {isEnrolled ? (
              <div className="flex items-center justify-center text-green-600 font-medium text-sm">
                <Check className="h-4 w-4 mr-1" />
                Enrolled
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
              >
                {isEnrolling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Enroll
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard;