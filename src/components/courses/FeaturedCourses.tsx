import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import CourseCard from './CourseCard';

interface FeaturedCoursesProps {
  courses: Course[];
}

const FeaturedCourses: React.FC<FeaturedCoursesProps> = ({ courses }) => {
  // Take only the first 3 featured courses
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="my-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
        <Link 
          to="/courses" 
          className="text-blue-600 hover:text-blue-800 flex items-center transition-colors"
        >
          View all courses
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedCourses;