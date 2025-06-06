import React from 'react';
import { Clock, Video, FileText, CheckCircle } from 'lucide-react';
import { Lesson } from '../../types';
import { Card, CardContent } from '../ui/Card';

interface LessonCardProps {
  lesson: Lesson;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isActive = false,
  isCompleted = false,
  onClick,
}) => {
  return (
    <Card
      className={`mb-3 transition-colors duration-200 ${
        isActive ? 'border-2 border-blue-500' : ''
      } ${isCompleted ? 'border-l-4 border-l-green-500' : ''}`}
      onClick={onClick}
      hoverEffect
    >
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <div className="mr-4 text-gray-500">
            {lesson.type === 'video' ? (
              <Video className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">{lesson.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center text-gray-500 mr-4">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">{lesson.duration}</span>
          </div>
          
          {isCompleted && (
            <div className="text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;