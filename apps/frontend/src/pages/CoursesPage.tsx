import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseGrid from '../components/courses/CourseGrid';
import CategoryFilter from '../components/courses/CategoryFilter';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

const CoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all courses
  const getAllCourses = useCallback(() => api.courses.getAll(), []);
  const { data: courses, loading, error } = useApi(getAllCourses);

  // Fetch categories
  const getCategories = useCallback(() => api.courses.getCategories(), []);
  const { data: categoriesData } = useApi(getCategories);

  // Fetch user enrollments
  const getUserEnrollments = useCallback(() => {
    if (!user?.id) return Promise.resolve([]);
    return api.enrollments.getUserEnrollments(user.id);
  }, [user?.id]);
  const { data: enrollments, refetch: refetchEnrollments } = useApi(getUserEnrollments);

  const categories = categoriesData?.map(cat => cat.name) || [];

  // Get enrolled course IDs
  const enrolledCourseIds = enrollments?.map(enrollment => enrollment.courseId) || [];

  // Handle enrollment changes
  const handleEnrollmentChange = () => {
    refetchEnrollments();
  };

  // Filter courses based on search and category
  const filteredCourses = React.useMemo(() => {
    if (!courses) return [];

    let result = [...courses];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        course =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
      
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(course => course.category === selectedCategory);
    }

    return result;
  }, [courses, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load courses. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
        <p className="text-gray-600">
          Browse our collection of expert-led courses on observability and software development
        </p>
      </div>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {searchQuery && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </p>
        </div>
      )}

      <CourseGrid
        courses={filteredCourses}
        enrolledCourseIds={enrolledCourseIds}
        onEnrollmentChange={handleEnrollmentChange}
      />
    </div>
  );
};

export default CoursesPage;