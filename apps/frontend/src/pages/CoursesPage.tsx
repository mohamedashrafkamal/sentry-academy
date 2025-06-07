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

  // TOFIX Module 2: Backend search API call - currently not passing search query correctly
  // Frontend team assumes the search API works like the courses.getAll() method with query params
  // but the backend expects the query in a different format
  const getSearchResults = useCallback(() => {
    if (searchQuery) {
      // BUG: Frontend team thinks they should pass search as a parameter object
      // but the backend search API expects it as a query string parameter 'q'
      console.log(`Frontend calling search API with query: "${searchQuery}"`);
      console.log('Frontend assumption: passing search as parameter object');
      
      // TOFIX Module 2: This call is missing the actual query parameter
      // Should be: api.search.courses(searchQuery)
      // But frontend thinks they need to call it without parameters like other APIs
      return api.search.courses(''); // BUG: Empty string instead of searchQuery
    } else {
      return api.courses.getAll();
    }
  }, [searchQuery]);

  const { data: searchResults, loading, error } = useApi(getSearchResults);

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

  // TOFIX Module 2: Frontend processes search results but backend might return different structure
  // Frontend assumes backend search returns same format as courses.getAll()
  // but search API returns { results: [], total: number, query: string }
  const processedCourses = React.useMemo(() => {
    if (!searchResults) return [];

    let courses;
    if (searchQuery) {
      // BUG: Frontend assumes search results are directly in the response
      // but backend returns { results: courses, total, query }
      console.log('Frontend processing search results:', searchResults);
      console.log('Frontend assumption: results are directly in response array');
      
      // TOFIX Module 2: Should be searchResults.results instead of searchResults
      courses = Array.isArray(searchResults) ? searchResults : [];
    } else {
      courses = searchResults || [];
    }

    // Filter by category (client-side filtering still applies for category)
    if (selectedCategory) {
      courses = courses.filter((course: any) => course.category === selectedCategory);
    }

    return courses;
  }, [searchResults, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {searchQuery ? `Searching for "${searchQuery}"...` : 'Loading courses...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600">
            {searchQuery 
              ? `Search failed: ${error.message}. Backend returned error for search query.`
              : 'Failed to load courses. Please try again later.'
            }
          </p>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Try searching for a different term or browse all courses instead.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {searchQuery ? `Search Results` : 'All Courses'}
        </h1>
        <p className="text-gray-600">
          {searchQuery 
            ? `Results for "${searchQuery}"` 
            : 'Browse our collection of expert-led courses on observability and software development'
          }
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
            {processedCourses.length} {processedCourses.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </p>
        </div>
      )}

      <CourseGrid
        courses={processedCourses}
        enrolledCourseIds={enrolledCourseIds}
        onEnrollmentChange={handleEnrollmentChange}
      />
    </div>
  );
};

export default CoursesPage;