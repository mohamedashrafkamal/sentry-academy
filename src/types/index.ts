export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  reviewCount: number;
  thumbnail: string;
  category: string;
  tags: string[];
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isFeatured: boolean;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'text';
  videoUrl?: string;
  content?: string;
  completed?: boolean;
}

export interface Progress {
  courseId: string;
  completedLessons: string[];
  lastAccessed: string;
}