import { User, Progress } from '../types';

export const users: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    role: 'student',
  },
  {
    id: '2',
    name: 'Emma Williams',
    email: 'emma@example.com',
    avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
    role: 'student',
  },
  {
    id: '3',
    name: 'Marcus Brown',
    email: 'marcus@example.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    role: 'instructor',
  },
];

export const userProgress: Progress[] = [
  {
    courseId: '1',
    completedLessons: ['1-1'],
    lastAccessed: '2025-05-15T10:30:00Z',
  },
  {
    courseId: '2',
    completedLessons: ['2-1', '2-2'],
    lastAccessed: '2025-05-14T15:45:00Z',
  },
];

export const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

export const getUserProgress = (userId: string): Progress[] => {
  // In a real application, this would filter by user ID
  return userProgress;
};

export const getFavoriteCourses = (userId: string): string[] => {
  // Mock implementation - would be user-specific in a real app
  return ['1', '3', '6'];
};