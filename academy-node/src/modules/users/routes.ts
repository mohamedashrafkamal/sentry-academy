/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { db } from '../../../db';
import {
  users,
  enrollments,
  courses,
  lessonProgress,
  certificates,
} from '../../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const userRoutes = express.Router();

// Get current user profile (mock auth - uses hardcoded user ID)
userRoutes.get('/me', async (req, res) => {
  try {
    // In a real app, we'd get this from the auth token
    const userId = 'demo-user-id';

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      // Create a demo user if not exists
      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'student',
        })
        .returning();

      res.json(newUser[0]);
      return;
    }

    res.json(user[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
userRoutes.put('/me', async (req, res) => {
  try {
    // In a real app, we'd get this from the auth token
    const userId = 'demo-user-id';

    const updated = await db
      .update(users)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's enrollments
userRoutes.get('/me/enrollments', async (req, res) => {
  try {
    // In a real app, we'd get this from the auth token
    const userId = 'demo-user-id';

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
      .orderBy(desc(enrollments.enrolledAt));

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      userEnrollments.map(async (e) => {
        const progress = await db
          .select({
            lessonId: lessonProgress.lessonId,
            completedAt: lessonProgress.completedAt,
          })
          .from(lessonProgress)
          .where(eq(lessonProgress.enrollmentId, e.enrollment.id));

        return {
          ...e.enrollment,
          course: {
            ...e.course,
            instructor: e.instructor,
          },
          completedLessons: progress.filter((p) => p.completedAt).length,
        };
      })
    );

    res.json(enrollmentsWithProgress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID (for instructors/admin)
userRoutes.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user statistics
    const stats = await db
      .select({
        enrollmentCount: sql<number>`count(distinct ${enrollments.id})`,
        completedCourses: sql<number>`count(distinct case when ${enrollments.completedAt} is not null then ${enrollments.id} end)`,
        certificateCount: sql<number>`count(distinct ${certificates.id})`,
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .leftJoin(certificates, eq(users.id, certificates.userId))
      .where(eq(users.id, id))
      .groupBy(users.id);

    res.json({
      ...user[0],
      stats: stats[0] || {
        enrollmentCount: 0,
        completedCourses: 0,
        certificateCount: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's certificates
userRoutes.get('/me/certificates', async (req, res) => {
  try {
    // In a real app, we'd get this from the auth token
    const userId = 'demo-user-id';

    const userCertificates = await db
      .select({
        certificate: certificates,
        course: courses,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));

    const result = userCertificates.map((c) => ({
      ...c.certificate,
      course: c.course,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's learning statistics
userRoutes.get('/me/stats', async (req, res) => {
  try {
    // In a real app, we'd get this from the auth token
    const userId = 'demo-user-id';

    // Get overall statistics
    const overallStats = await db
      .select({
        totalEnrollments: sql<number>`count(distinct ${enrollments.id})`,
        completedCourses: sql<number>`count(distinct case when ${enrollments.completedAt} is not null then ${enrollments.id} end)`,
        totalTimeSpent: sql<number>`coalesce(sum(${lessonProgress.timeSpent}), 0)`,
        lessonsCompleted: sql<number>`count(distinct case when ${lessonProgress.completedAt} is not null then ${lessonProgress.id} end)`,
      })
      .from(enrollments)
      .leftJoin(
        lessonProgress,
        and(
          eq(lessonProgress.enrollmentId, enrollments.id),
          eq(lessonProgress.userId, userId)
        )
      )
      .where(eq(enrollments.userId, userId));

    // Get learning streak (days in a row with activity)
    const activityDays = await db
      .select({
        date: sql<string>`date(${lessonProgress.updatedAt})`,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId))
      .groupBy(sql`date(${lessonProgress.updatedAt})`)
      .orderBy(desc(sql`date(${lessonProgress.updatedAt})`))
      .limit(30);

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const dates = activityDays.map((d) => new Date(d.date));

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (dates[i].toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      ...overallStats[0],
      currentStreak,
      recentActivity: activityDays.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (for registration - mock implementation)
userRoutes.post('/users', async (req, res) => {
  try {
    const userId = createId();

    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        email: req.body.email,
        name: req.body.name,
        role: req.body.role || 'student',
      })
      .returning();

    res.json(newUser[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
