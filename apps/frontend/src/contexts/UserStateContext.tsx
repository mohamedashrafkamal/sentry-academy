import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Course } from '../types';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export interface UserEnrollment {
  id: string;
  courseId: string;
  course: Course;
  enrolledAt: string;
  progress: number;
}

export interface UserProfile {
  enrollments: UserEnrollment[];
  favoritesCourseIds: string[];
}

interface UserStateContextType {
  profile: UserProfile;
  isCourseFavorited: (courseId: string) => boolean;
  isCourseEnrolled: (courseId: string) => boolean;
  toggleFavorite: (course: Course) => void;
  enrollInCourse: (course: Course) => Promise<void>;
  unenrollFromCourse: (courseId: string) => void;
  getEnrolledCourses: () => Course[];
  getFavoritedCourses: (allCourses: Course[]) => Course[];
  updateCourseProgress: (courseId: string, progress: number) => void;
}

const defaultProfile: UserProfile = {
  enrollments: [],
  favoritesCourseIds: [],
};

export const UserStateContext = createContext<UserStateContextType | undefined>(undefined);

export const UserStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  // Generate storage key based on user ID
  const getStorageKey = useCallback(() => {
    return user?.id ? `userProfile_${user.id}` : null;
  }, [user?.id]);

  // Load user profile from localStorage when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const storageKey = getStorageKey();
      if (storageKey) {
        const storedProfile = localStorage.getItem(storageKey);
        if (storedProfile) {
          try {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
          } catch (error) {
            console.error('Failed to parse stored user profile:', error);
            setProfile(defaultProfile);
          }
        }
      }
    } else {
      // Clear profile when user logs out
      setProfile(defaultProfile);
    }
  }, [user?.id, isAuthenticated, getStorageKey]);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (user?.id) {
      const storageKey = getStorageKey();
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(profile));
      }
    }
  }, [profile, user?.id, getStorageKey]);

  const isCourseFavorited = useCallback((courseId: string): boolean => {
    return profile.favoritesCourseIds.includes(courseId);
  }, [profile.favoritesCourseIds]);

  const isCourseEnrolled = useCallback((courseId: string): boolean => {
    return profile.enrollments.some(enrollment => enrollment.courseId === courseId);
  }, [profile.enrollments]);

  const toggleFavorite = useCallback((course: Course): void => {
    setProfile(prevProfile => {
      const isFavorited = prevProfile.favoritesCourseIds.includes(course.id);
      
      if (isFavorited) {
        // Remove from favorites
        return {
          ...prevProfile,
          favoritesCourseIds: prevProfile.favoritesCourseIds.filter(id => id !== course.id),
        };
      } else {
        // Add to favorites
        return {
          ...prevProfile,
          favoritesCourseIds: [...prevProfile.favoritesCourseIds, course.id],
        };
      }
    });
  }, []);

  const enrollInCourse = useCallback(async (course: Course): Promise<void> => {
    // Check if already enrolled locally
    if (profile.enrollments.some(enrollment => enrollment.courseId === course.id)) {
      return; // Already enrolled, no need to call API
    }

    try {
      // Call the API to create enrollment on the server
      // Let the server validate user ID and return appropriate errors
      await api.enrollments.create(course?.id, user?.id);

      // If API call succeeds, update local state
      setProfile(prevProfile => {
        const newEnrollment: UserEnrollment = {
          id: `enrollment_${course.id}_${Date.now()}`,
          courseId: course.id,
          course: course,
          enrolledAt: new Date().toISOString(),
          progress: 0,
        };

        return {
          ...prevProfile,
          enrollments: [...prevProfile.enrollments, newEnrollment],
        };
      });
    } catch (error) {
      // Re-throw the error so the calling component can handle it
      console.error('Failed to enroll in course:', error);
      throw error;
    }
  }, [user?.id, profile.enrollments]);

  const unenrollFromCourse = useCallback((courseId: string): void => {
    setProfile(prevProfile => ({
      ...prevProfile,
      enrollments: prevProfile.enrollments.filter(enrollment => enrollment.courseId !== courseId),
    }));
  }, []);

  const getEnrolledCourses = useCallback((): Course[] => {
    return profile.enrollments.map(enrollment => enrollment.course);
  }, [profile.enrollments]);

  const getFavoritedCourses = useCallback((allCourses: Course[]): Course[] => {
    return allCourses.filter(course => profile.favoritesCourseIds.includes(course.id));
  }, [profile.favoritesCourseIds]);

  const updateCourseProgress = useCallback((courseId: string, progress: number): void => {
    setProfile(prevProfile => ({
      ...prevProfile,
      enrollments: prevProfile.enrollments.map(enrollment =>
        enrollment.courseId === courseId
          ? { ...enrollment, progress }
          : enrollment
      ),
    }));
  }, []);

  return (
    <UserStateContext.Provider
      value={{
        profile,
        isCourseFavorited,
        isCourseEnrolled,
        toggleFavorite,
        enrollInCourse,
        unenrollFromCourse,
        getEnrolledCourses,
        getFavoritedCourses,
        updateCourseProgress,
      }}
    >
      {children}
    </UserStateContext.Provider>
  );
};