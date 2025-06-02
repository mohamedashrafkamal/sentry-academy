import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import FeaturedCourses from '../components/courses/FeaturedCourses';
import StatisticsSection from '../components/home/StatisticsSection';
import TestimonialSection from '../components/home/TestimonialSection';
import { Button } from '../components/ui/Button';
import { getFeaturedCourses } from '../data/courses';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const featuredCourses = getFeaturedCourses();

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6">
      <HeroSection />
      
      <StatisticsSection />
      
      <FeaturedCourses courses={featuredCourses} />
      
      <div className="py-16 bg-gray-50 rounded-xl my-12">
        <div className="text-center max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start Your Learning Journey Today
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of developers who are mastering observability and software 
            development with our expert-led courses.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/courses')}
          >
            Browse All Courses
          </Button>
        </div>
      </div>
      
      <TestimonialSection />
      
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl my-12 text-white overflow-hidden">
        <div className="md:flex md:items-center">
          <div className="p-10 md:p-16 md:w-1/2">
            <h2 className="text-3xl font-bold mb-6">Ready to advance your career with in-demand skills?</h2>
            <p className="text-blue-100 mb-8">
              Our courses cover the latest techniques in observability, error tracking, 
              and software development best practices.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/signup')}
            >
              Sign up for free
            </Button>
          </div>
          <div className="md:w-1/2 h-64 md:h-auto relative">
            <img
              src="https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg"
              alt="Developer coding"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;