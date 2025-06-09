import express from 'express';
import { db } from '../../../db';
import {
  enrollments,
  courses,
  users,
  lessons,
  lessonProgress,
} from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

console.log('🎓 Loading enrollment routes...');

export const enrollmentRoutes = express.Router();

// Test endpoint to verify routing
enrollmentRoutes.get('/test', (req, res) => {
  const msg = '🧪 Test endpoint hit';
  console.log(msg);
  process.stdout.write(msg + '\n');
  res.json({ message: 'Enrollment routes are working!' });
});

// TOFIX Module 3: Broken enrollments missing userId
enrollmentRoutes.post('/enrollments', async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    console.log('🔍 Checking enrollment request:', { userId, courseId });

    // First: Validate course ID is provided
    if (!courseId) {
      console.error('❌ Course ID is missing');
      res.status(400).json({ error: 'Course ID is required.' });
      return;
    }

    const courseCheck = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (courseCheck.length === 0) {
      console.error('❌ Course not found:', courseId);
      res.status(404).json({ error: `Course with id ${courseId} not found` });
      return;
    }

    const course = courseCheck[0];

    // Third: Validate user ID is provided
    if (!userId) {
      console.error('❌ User ID is missing');
      throw new Error('User ID is missing');
    }

    console.log('✅ All validation successful, enrollment approved');
    res.json({ 
      success: true, 
      message: 'Enrollment validation successful',
      courseId,
      userId 
    });

  } catch (error: any) {
    console.error('💥 Error during enrollment:', error);
    console.error('📊 Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.body.userId,
      courseId: req.body.courseId,
    });
    throw new Error('Failed to enroll in course');
  }
});

// Get user's enrollments
enrollmentRoutes.get('/enrollments/user/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('📚 Getting enrollments for user:', userId);

  try {
    const userEnrollments = await db
      .select({
        enrollment: enrollments,
        course: courses,
        instructor: users.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(courses.instructorId, users.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(enrollments.enrolledAt);

    console.log('📋 User enrollments found:', userEnrollments.length);
    console.log('📝 Enrollment details:', userEnrollments);

    const result = userEnrollments.map((e) => ({
      ...e.enrollment,
      course: {
        ...e.course,
        instructor: e.instructor,
      },
    }));

    console.log('✅ Returning formatted enrollments:', result.length);
    res.json(result);
  } catch (error: any) {
    console.error('💥 Error getting user enrollments:', error);
    console.error('📊 Error details:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
    res.status(500).json({ error: error.message });
  }
});

// Get single enrollment with progress
enrollmentRoutes.get('/enrollments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);

    if (!enrollment.length) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    // Get course details
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, enrollment[0].courseId))
      .limit(1);

    // Get all lessons for the course
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, enrollment[0].courseId))
      .orderBy(lessons.order);

    // Get completed lessons
    const completedLessons = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.enrollmentId, id),
          eq(lessonProgress.userId, enrollment[0].userId)
        )
      );

    // Calculate progress
    const totalLessons = courseLessons.length;
    const completedCount = completedLessons.filter(
      (l) => l.completedAt !== null
    ).length;
    const progress =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Update progress in enrollment
    if (progress !== enrollment[0].progress) {
      await db
        .update(enrollments)
        .set({ progress })
        .where(eq(enrollments.id, id));
    }

    res.json({
      ...enrollment[0],
      course: course[0],
      lessons: courseLessons,
      completedLessons: completedLessons.map((l) => l.lessonId),
      progress,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update enrollment (e.g., mark as completed)
enrollmentRoutes.put('/enrollments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await db
      .update(enrollments)
      .set({
        ...req.body,
        lastAccessedAt: new Date(),
      })
      .where(eq(enrollments.id, id))
      .returning();

    if (!updated.length) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollment progress details
enrollmentRoutes.get('/enrollments/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);

    if (!enrollment.length) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    // Get all lesson progress for this enrollment
    const progress = await db
      .select({
        lesson: lessons,
        progress: lessonProgress,
      })
      .from(lessons)
      .leftJoin(
        lessonProgress,
        and(
          eq(lessonProgress.lessonId, lessons.id),
          eq(lessonProgress.enrollmentId, id)
        )
      )
      .where(eq(lessons.courseId, enrollment[0].courseId))
      .orderBy(lessons.order);

    const totalLessons = progress.length;
    const completedLessons = progress.filter(
      (p) => p.progress?.completedAt
    ).length;
    const totalTimeSpent = progress.reduce(
      (sum, p) => sum + (p.progress?.timeSpent || 0),
      0
    );

    res.json({
      enrollmentId: id,
      courseId: enrollment[0].courseId,
      totalLessons,
      completedLessons,
      progressPercentage:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      totalTimeSpent,
      lessons: progress.map((p) => ({
        ...p.lesson,
        completed: !!p.progress?.completedAt,
        completedAt: p.progress?.completedAt,
        timeSpent: p.progress?.timeSpent || 0,
        lastPosition: p.progress?.lastPosition || 0,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete enrollment (unenroll from course)
enrollmentRoutes.delete('/enrollments/:id', async (req, res) => {
  const { id } = req.params;
  console.log('🗑️ Deleting enrollment:', id);

  try {
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);

    console.log('🔍 Enrollment to delete:', enrollment);

    if (!enrollment.length) {
      console.error('❌ Enrollment not found:', id);
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    // Delete enrollment
    console.log('💾 Deleting enrollment from database...');
    await db.delete(enrollments).where(eq(enrollments.id, id));

    console.log('✅ Enrollment deleted successfully');

    // Update course enrollment count
    console.log('📉 Updating course enrollment count...');
    await db
      .update(courses)
      .set({
        enrollmentCount: sql`${courses.enrollmentCount} - 1`,
      })
      .where(eq(courses.id, enrollment[0].courseId));

    console.log('✅ Course enrollment count updated');
    console.log('🎉 Unenrollment process completed successfully');

    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('💥 Error during unenrollment:', error);
    console.error('📊 Error details:', {
      message: error.message,
      stack: error.stack,
      enrollmentId: id,
    });
    res.status(500).json({ error: error.message });
  }
});
