import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseGrid from '../components/courses/CourseGrid';
import CategoryFilter from '../components/courses/CategoryFilter';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import * as Sentry from '@sentry/react';

const CoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // API call - will fail when searching due to parameter mismatch
  const getCourses = useCallback(() => {
    if (searchQuery) {
      console.log(`Frontend: Searching for "${searchQuery}"`);
      // This will fail because frontend sends 'query' but backend expects 'q'
      return api.search.courses(searchQuery);
    } else {
      console.log('Frontend: Loading all courses');
      return api.courses.getAll();
    }
  }, [searchQuery]);

  const { data: coursesData, loading, error } = useApi(getCourses);
  const getCategories = useCallback(() => Sentry.startSpan({ name: 'all-courses-content-load', op: 'cx' }, () => api.courses.getCategories()), []);
  const { data: categoriesData } = useApi(getCategories);

  const categories = categoriesData?.map(cat => cat.name) || [];

  // Process courses data
  const processedCourses = React.useMemo(() => {
    if (!coursesData) return [];

    let courses = searchQuery ? (coursesData as any).results || [] : coursesData;

    // Filter by category if selected
    if (selectedCategory && courses) {
      courses = courses.filter((course: any) => course.category === selectedCategory);
    }

    return courses || [];
  }, [coursesData, searchQuery, selectedCategory]);

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
              ? `Search failed: ${error.message}`
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
            : 'Browse our collection of expert-led courses'
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

      <CourseGrid courses={[...processedCourses, { title: 'Test Course', description: 'Test Description', category: 'Test Category', level: 'beginner', instructor: 'Test Instructor', thumbnail: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg', price: 100, rating: 4.5, reviewCount: 10, enrollmentCount: 100, isFeatured: true, createdAt: new Date(), publishedAt: new Date() }]} />
    </div>
  );
};

export default CoursesPage;