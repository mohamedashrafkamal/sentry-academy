import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseGrid from '../components/courses/CourseGrid';
import CategoryFilter from '../components/courses/CategoryFilter';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

const CoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

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

  const categories = categoriesData?.map(cat => cat.name) || [];

  // TOFIX Module 2: Frontend processes search results but backend might return different structure
  // Frontend assumes backend search returns same format as courses.getAll()
  // but search API returns { results: [], total: number, query: string } OR error object
  const processedCourses = React.useMemo(() => {
    if (!searchResults) return [];

    let courses: any[] = [];
    if (searchQuery) {
      // BUG: Frontend assumes search results are directly in the response
      // but backend returns { results: courses, total, query } for success
      // OR { error: string, message: string, details: object } for errors
      console.log('Frontend processing search results:', searchResults);
      console.log('Frontend assumption: results are directly in response array');
      
      // TOFIX Module 2: Frontend treats error responses as data and tries to access course properties
      // This will cause unhandled errors when backend returns error structure instead of course data
      if (searchResults) {
        // BUG: If backend returned an error object, this will try to treat it as course data
        // Error objects have properties like { error: "SEARCH_PARAMETER_ERROR", message: "...", details: {...} }
        // But frontend expects course arrays with properties like title, description, etc.
        
        // TOFIX Module 2: Should check if searchResults.results exists
        // But frontend assumes it's always course data
        courses = Array.isArray(searchResults) ? searchResults : [];
        
        // BUG: Frontend tries to access course properties on error objects
        // This will cause unhandled TypeError when accessing properties that don't exist
        console.log('Frontend attempting to process as course data...');
        
        // TOFIX Module 2: This will throw unhandled error if searchResults is error object
        if (courses.length === 0 && searchResults) {
          // BUG: Frontend assumes all responses have course-like structure
          // Try to access course properties on what might be an error object
          const possibleCourses = (searchResults as any).results || searchResults;
          
          // BUG: Force treatment as course array even if it's an error object
          if (possibleCourses && !Array.isArray(possibleCourses)) {
            // TOFIX Module 2: This will cause unhandled error - accessing title on error object
            console.log('Attempting to read course properties from response...');
            
            // This will throw unhandled TypeError if searchResults is error object like:
            // { error: "SEARCH_PARAMETER_ERROR", message: "...", details: {...} }
            const firstItem = possibleCourses;
            
            // BUG: Try to access course properties that don't exist on error objects
            // This causes unhandled error: Cannot read property 'title' of undefined
            if (firstItem.title) {
              courses = [firstItem];
            } else if (firstItem.error) {
              // TOFIX Module 2: Frontend discovers it's an error but still tries to process it
              console.error('Frontend discovered error response but will still try to process:', firstItem.error);
              
              // BUG: Even knowing it's an error, frontend still tries to extract course data
              // This will cause unhandled property access errors
              const errorData = firstItem.details;
              const receivedParam = errorData.received; // This will throw if errorData is undefined
              
              // TOFIX Module 2: This will throw unhandled error accessing properties on undefined
              console.log('Trying to extract course info from error details...');
              console.log('Received parameter info:', receivedParam.length); // Unhandled error here!
              
              courses = []; // This line never reached due to error above
            }
          }
        }
      }
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

  // TOFIX Module 2: Frontend shows generic error but unhandled errors already thrown above
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

      <CourseGrid courses={processedCourses} />
    </div>
  );
};

export default CoursesPage;