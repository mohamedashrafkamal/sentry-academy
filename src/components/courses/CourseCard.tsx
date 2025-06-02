import React from 'react';
import { Star, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = '' }) => {
  const navigate = useNavigate();
  
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
      </CardContent>
    </Card>
  );
};

export default CourseCard;