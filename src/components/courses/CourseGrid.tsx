import React from 'react';
import { Course } from '../../types';
import CourseCard from './CourseCard';

interface CourseGridProps {
  courses: Course[];
  title?: string;
  description?: string;
  className?: string;
}

const CourseGrid: React.FC<CourseGridProps> = ({ 
  courses, 
  title, 
  description,
  className = '' 
}) => {
  return (
    <div className={className}>
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseGrid;