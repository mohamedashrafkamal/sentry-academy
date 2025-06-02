import { Elysia, t } from 'elysia';
import { db, enrollments, courses, users, lessons, lessonProgress } from '../../../db';
import { eq, and, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const enrollmentRoutes = new Elysia({ prefix: '/enrollments' })
  // Create enrollment (enroll in a course)
  .post('/', async ({ body }) => {
    const { userId, courseId } = body;
    
    // Check if already enrolled
    const existing = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0]; // Return existing enrollment
    }
    
    const enrollmentId = createId();
    
    // Create new enrollment
    const newEnrollment = await db
      .insert(enrollments)
      .values({
        id: enrollmentId,
        userId,
        courseId,
        progress: 0,
      })
      .returning();
    
    // Update course enrollment count
    await db
      .update(courses)
      .set({
        enrollmentCount: sql`${courses.enrollmentCount} + 1`,
      })
      .where(eq(courses.id, courseId));
    
    return newEnrollment[0];
  }, {
    body: t.Object({
      userId: t.String(),
      courseId: t.String(),
    })
  })
  
  // Get user's enrollments
  .get('/user/:userId', async ({ params: { userId } }) => {
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
    
    return userEnrollments.map(e => ({
      ...e.enrollment,
      course: {
        ...e.course,
        instructor: e.instructor,
      },
    }));
  }, {
    params: t.Object({
      userId: t.String()
    })
  })
  
  // Get single enrollment with progress
  .get('/:id', async ({ params: { id } }) => {
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);
    
    if (!enrollment.length) {
      throw new Error('Enrollment not found');
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
    const completedCount = completedLessons.filter(l => l.completedAt !== null).length;
    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    // Update progress in enrollment
    if (progress !== enrollment[0].progress) {
      await db
        .update(enrollments)
        .set({ progress })
        .where(eq(enrollments.id, id));
    }
    
    return {
      ...enrollment[0],
      course: course[0],
      lessons: courseLessons,
      completedLessons: completedLessons.map(l => l.lessonId),
      progress,
    };
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  // Update enrollment (e.g., mark as completed)
  .put('/:id', async ({ params: { id }, body }) => {
    const updated = await db
      .update(enrollments)
      .set({
        ...body,
        lastAccessedAt: new Date(),
      })
      .where(eq(enrollments.id, id))
      .returning();
    
    if (!updated.length) {
      throw new Error('Enrollment not found');
    }
    
    return updated[0];
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      progress: t.Optional(t.Number()),
      completedAt: t.Optional(t.String()),
    })
  })
  
  // Get enrollment progress details
  .get('/:id/progress', async ({ params: { id } }) => {
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);
    
    if (!enrollment.length) {
      throw new Error('Enrollment not found');
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
    const completedLessons = progress.filter(p => p.progress?.completedAt).length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.progress?.timeSpent || 0), 0);
    
    return {
      enrollmentId: id,
      courseId: enrollment[0].courseId,
      totalLessons,
      completedLessons,
      progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      totalTimeSpent,
      lessons: progress.map(p => ({
        ...p.lesson,
        completed: !!p.progress?.completedAt,
        completedAt: p.progress?.completedAt,
        timeSpent: p.progress?.timeSpent || 0,
        lastPosition: p.progress?.lastPosition || 0,
      })),
    };
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  // Delete enrollment (unenroll from course)
  .delete('/:id', async ({ params: { id } }) => {
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .limit(1);
    
    if (!enrollment.length) {
      throw new Error('Enrollment not found');
    }
    
    // Delete enrollment
    await db
      .delete(enrollments)
      .where(eq(enrollments.id, id));
    
    // Update course enrollment count
    await db
      .update(courses)
      .set({
        enrollmentCount: sql`${courses.enrollmentCount} - 1`,
      })
      .where(eq(courses.id, enrollment[0].courseId));
    
    return { success: true, deletedId: id };
  }, {
    params: t.Object({
      id: t.String()
    })
  });