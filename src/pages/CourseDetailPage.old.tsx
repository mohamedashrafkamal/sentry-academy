import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  BookOpen,
  Star,
  Award,
  Bookmark,
  Share2
} from 'lucide-react';
import { getCourseById } from '../data/courses';
import { getUserProgress, getFavoriteCourses } from '../data/users';
import { Lesson } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import LessonList from '../components/lessons/LessonList';

const CourseDetailPage: React.FC = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const course = getCourseById(courseId);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!course) return;

    // Set the first lesson as active by default
    if (course.lessons.length > 0 && !activeLesson) {
      setActiveLesson(course.lessons[0]);
    }

    // Check if course is bookmarked
    if (user) {
      const favorites = getFavoriteCourses(user.id);
      setIsBookmarked(favorites.includes(courseId));
    }
  }, [course, user, courseId, activeLesson]);

  // Get user progress for this course
  const userProgress = user ? getUserProgress(user.id) : [];
  const courseProgress = userProgress.find(p => p.courseId === courseId);
  const completedLessons = courseProgress?.completedLessons || [];

  if (!course) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
        <p className="text-gray-600 mb-8">The course you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/courses')}>
          Browse All Courses
        </Button>
      </div>
    );
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    const lesson = course.lessons.find(l => l.id === lessonId);
    if (lesson) {
      setActiveLesson(lesson);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In a real app, this would update the user's favorites in the database
  };

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="primary">{course.category}</Badge>
              <Badge
                variant={getLevelBadgeVariant(course.level)}
                className="flex items-center"
              >
                <Award className="h-3 w-3 mr-1" />
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>

            <p className="text-gray-600 mb-4">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {course.duration}
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {course.lessons.length} lessons
              </div>
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 fill-current mr-1" />
                <span>{course.rating}</span>
                <span className="text-gray-600 ml-1">({course.reviewCount} reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                leftIcon={<BookOpen size={16} />}
                onClick={() => navigate(`/courses/${courseId}/learn`)}
              >
                Start Learning
              </Button>

              <Button
                variant="outline"
                leftIcon={<Bookmark size={16} className={isBookmarked ? "fill-current" : ""} />}
                onClick={toggleBookmark}
              >
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>

              <Button
                variant="ghost"
                leftIcon={<Share2 size={16} />}
              >
                Share
              </Button>
            </div>
          </div>

          {/* Preview section - in a real app, this would be a video or lesson preview */}
          <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video mb-8 flex items-center justify-center">
            <div className="text-center p-8">
              <BookOpen className="h-16 w-16 text-white opacity-50 mx-auto mb-4" />
              <p className="text-white text-lg">Preview this course content</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-8">
            <h2 className="text-xl font-bold mb-4">About this course</h2>
            <p className="text-gray-700 mb-4">
              Learn the core concepts of observability and how to implement them in your applications.
              This course covers metrics, logs, and traces to give you a comprehensive understanding
              of modern monitoring practices.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-2">What you'll learn</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Implement robust error tracking systems
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Set up comprehensive logging pipelines
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Monitor application performance
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Analyze and visualize monitoring data
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Create effective alerts and notifications
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Debug complex distributed systems
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-2">This course is perfect for:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Software developers wanting to improve their debugging skills
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                DevOps engineers implementing monitoring solutions
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Engineering managers looking to improve team operations
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Instructor</h2>
              <Button variant="outline" size="sm">View Profile</Button>
            </div>

            <div className="flex items-center">
              <img
                src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                alt={course.instructor}
                className="w-16 h-16 rounded-full object-cover mr-4"
              />
              <div>
                <h3 className="font-semibold text-lg">{course.instructor}</h3>
                <p className="text-gray-600">Senior Software Engineer & Instructor</p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  <span>5,000+ students</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-gray-700">
              Expert in observability and distributed systems with over 10 years of industry experience
              working with companies like Netflix and Airbnb. Passionate about teaching pragmatic,
              real-world skills to developers.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 sticky top-6">
            <LessonList
              lessons={course.lessons}
              activeLessonId={activeLesson?.id}
              completedLessons={completedLessons}
              onSelectLesson={handleSelectLesson}
            />

            <div className="p-6 border-t border-gray-100">
              <Button
                fullWidth
                leftIcon={<BookOpen size={16} />}
                onClick={() => navigate(`/courses/${courseId}/learn`)}
              >
                Start Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;