import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { getFavoriteCourses } from '../data/users';
import { getCourseById } from '../data/courses';
import { Course } from '../types';
import CourseGrid from '../components/courses/CourseGrid';
import { Button } from '../components/ui/Button';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  let favoriteCourses: Course[] = [];

  if (user) {
    const favoriteIds = getFavoriteCourses(user.id);
    favoriteCourses = favoriteIds
      .map(id => getCourseById(id))
      .filter((course): course is Course => course !== undefined);
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Favorites</h1>
        <p className="text-gray-600">
          Courses you've bookmarked for later
        </p>
      </div>

      {favoriteCourses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">No favorites yet</h2>
          <p className="text-gray-600 mb-6">
            Browse our courses and bookmark the ones you're interested in to find them here.
          </p>
          <Button
            leftIcon={<BookOpen size={16} />}
            onClick={() => navigate('/courses')}
          >
            Browse Courses
          </Button>
        </div>
      ) : (
        <CourseGrid courses={favoriteCourses} />
      )}
    </div>
  );
};

export default FavoritesPage;