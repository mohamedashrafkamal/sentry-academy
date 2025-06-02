import { Elysia, t } from 'elysia';
import { db, users, enrollments, courses, lessonProgress, certificates } from '../../../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const userRoutes = new Elysia({ prefix: '/users' })
  // Get current user profile (mock auth - uses hardcoded user ID)
  .get('/me', async () => {
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
      
      return newUser[0];
    }
    
    return user[0];
  })
  
  // Update user profile
  .put('/me', async ({ body }) => {
    // In a real app, we'd get this from the auth token
    const userId = 'demo-user-id';
    
    const updated = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updated.length) {
      throw new Error('User not found');
    }
    
    return updated[0];
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      bio: t.Optional(t.String()),
      avatarUrl: t.Optional(t.String()),
    })
  })
  
  // Get user's enrollments
  .get('/me/enrollments', async () => {
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
          completedLessons: progress.filter(p => p.completedAt).length,
        };
      })
    );
    
    return enrollmentsWithProgress;
  })
  
  // Get user by ID (for instructors/admin)
  .get('/:id', async ({ params: { id } }) => {
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
      throw new Error('User not found');
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
    
    return {
      ...user[0],
      stats: stats[0] || {
        enrollmentCount: 0,
        completedCourses: 0,
        certificateCount: 0,
      },
    };
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  // Get user's certificates
  .get('/me/certificates', async () => {
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
    
    return userCertificates.map(c => ({
      ...c.certificate,
      course: c.course,
    }));
  })
  
  // Get user's learning statistics
  .get('/me/stats', async () => {
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
      .leftJoin(lessonProgress, and(
        eq(lessonProgress.enrollmentId, enrollments.id),
        eq(lessonProgress.userId, userId)
      ))
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
    const dates = activityDays.map(d => new Date(d.date));
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (dates[i].toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      ...overallStats[0],
      currentStreak,
      recentActivity: activityDays.length,
    };
  })
  
  // Create new user (for registration - mock implementation)
  .post('/', async ({ body }) => {
    const userId = createId();
    
    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        email: body.email,
        name: body.name,
        role: body.role || 'student',
      })
      .returning();
    
    return newUser[0];
  }, {
    body: t.Object({
      email: t.String(),
      name: t.String(),
      role: t.Optional(t.Union([t.Literal('student'), t.Literal('instructor'), t.Literal('admin')])),
    })
  });