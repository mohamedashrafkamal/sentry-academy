import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courses } from '../data/courses';
import { Course } from '../types';
import CourseGrid from '../components/courses/CourseGrid';
import CategoryFilter from '../components/courses/CategoryFilter';

const CoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get unique categories from courses
  const categories = [...new Set(courses.map(course => course.category))];
  
  useEffect(() => {
    let result = [...courses];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        course => 
          course.title.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query) ||
          course.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(course => course.category === selectedCategory);
    }
    
    setFilteredCourses(result);
  }, [searchQuery, selectedCategory]);
  
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
      
      <CourseGrid courses={filteredCourses} />
    </div>
  );
};

export default CoursesPage;