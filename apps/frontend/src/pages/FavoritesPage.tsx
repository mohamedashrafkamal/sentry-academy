import React, { useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserState } from '../hooks/useUserState';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import CourseGrid from '../components/courses/CourseGrid';
import { Button } from '../components/ui/Button';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { getFavoritedCourses } = useUserState();
  const navigate = useNavigate();

  // Fetch all courses to get the full course data for favorited courses
  const getAllCourses = useCallback(() => api.courses.getAll(), []);
  const { data: allCourses, loading, error } = useApi(getAllCourses);

  const favoriteCourses = allCourses ? getFavoritedCourses(allCourses) : [];

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load your favorites. Please try again later.</p>
        </div>
      </div>
    );
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