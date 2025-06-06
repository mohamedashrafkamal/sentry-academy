import React, { useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import CourseCard from '../components/courses/CourseCard';
import { Trash2 } from 'lucide-react';

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch user's enrolled courses
  const getUserEnrollments = useCallback(() => {
    if (!user?.id) return Promise.resolve([]);
    return api.enrollments.getUserEnrollments(user.id);
  }, [user?.id]);

  const { data: enrollments, loading, error, refetch } = useApi(getUserEnrollments);

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return;
    }

    try {
      await api.enrollments.delete(enrollmentId);
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Failed to unenroll:', error);
      alert('Failed to unenroll from the course. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load your courses. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">
          {enrollments?.length ?
            `You're enrolled in ${enrollments.length} ${enrollments.length === 1 ? 'course' : 'courses'}` :
            'You haven\'t enrolled in any courses yet'
          }
        </p>
      </div>

      {!enrollments?.length ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">
              Browse our course catalog and enroll in courses that interest you.
            </p>
            <a
              href="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Courses
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="relative">
              <CourseCard course={enrollment.course} />

              {/* Progress indicator */}
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${enrollment.progress || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">
                  {enrollment.progress || 0}% complete
                </span>

                {/* Unenroll button */}
                <button
                  onClick={() => handleUnenroll(enrollment.id)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="Unenroll from course"
                >
                  <Trash2 size={12} className="mr-1" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;