import React from 'react';
import { Lesson } from '../../types';
import LessonCard from './LessonCard';

interface LessonListProps {
  lessons: Lesson[];
  activeLessonId?: string;
  completedLessons?: string[];
  onSelectLesson: (lessonId: string) => void;
}

const LessonList: React.FC<LessonListProps> = ({
  lessons,
  activeLessonId,
  completedLessons = [],
  onSelectLesson,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Course Content</h3>
      <p className="text-gray-600 text-sm mb-4">{lessons.length} lessons</p>
      
      <div>
        {lessons.map(lesson => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            isActive={activeLessonId === lesson.id}
            isCompleted={completedLessons.includes(lesson.id)}
            onClick={() => onSelectLesson(lesson.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default LessonList;