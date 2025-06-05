/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Create enrollment (enroll in a course)
enrollmentRoutes.post('/enrollments', async (req, res) => {
  process.stdout.write('ENROLLMENT POST HIT\n');
  const msg = `📝 Enrollment request received: ${JSON.stringify({
    body: req.body,
  })}`;
  console.log(msg);
  process.stdout.write(msg + '\n');

  const { userId, courseId } = req.body;

  console.log('🔍 Checking for existing enrollment:', { userId, courseId });

  try {
    // Check if already enrolled
    const existing = await db
      .select()
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
      )
      .limit(1);

    console.log('📋 Existing enrollment check result:', existing);

    if (existing.length > 0) {
      console.log('✅ User already enrolled, returning existing enrollment');
      res.json(existing[0]); // Return existing enrollment
      return;
    }

    // Verify user exists
    console.log('🔍 Verifying user exists:', userId);
    const userCheck = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log('👤 User check result:', userCheck);

    if (userCheck.length === 0) {
      console.error('❌ User not found:', userId);
      res.status(404).json({ error: `User with id ${userId} not found` });
      return;
    }

    // Verify course exists
    console.log('🔍 Verifying course exists:', courseId);
    const courseCheck = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    console.log('📚 Course check result:', courseCheck);

    if (courseCheck.length === 0) {
      console.error('❌ Course not found:', courseId);
      res.status(404).json({ error: `Course with id ${courseId} not found` });
      return;
    }

    const enrollmentId = createId();
    console.log('🆔 Generated enrollment ID:', enrollmentId);

    // Create new enrollment
    console.log('💾 Creating new enrollment...');
    const newEnrollment = await db
      .insert(enrollments)
      .values({
        id: enrollmentId,
        userId,
        courseId,
        progress: 0,
      })
      .returning();

    console.log('✅ New enrollment created:', newEnrollment[0]);

    // Update course enrollment count
    console.log('📈 Updating course enrollment count...');
    await db
      .update(courses)
      .set({
        enrollmentCount: sql`${courses.enrollmentCount} + 1`,
      })
      .where(eq(courses.id, courseId));

    console.log('✅ Course enrollment count updated');
    console.log('🎉 Enrollment process completed successfully');

    res.json(newEnrollment[0]);
  } catch (error: any) {
    console.error('💥 Error during enrollment:', error);
    console.error('📊 Error details:', {
      message: error.message,
      stack: error.stack,
      userId,
      courseId,
    });
    res.status(500).json({ error: error.message });
  }
});

// Get user's enrollments
enrollmentRoutes.get('/user/:userId', async (req, res) => {
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
