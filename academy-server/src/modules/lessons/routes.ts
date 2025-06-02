import { Elysia, t } from 'elysia';
import { db, lessons, lessonProgress, courses } from '../../../db';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const lessonRoutes = new Elysia({ prefix: '/lessons' })
  // Get lessons by course
  .get('/course/:courseId', async ({ params: { courseId } }) => {
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
    
    return courseLessons;
  }, {
    params: t.Object({
      courseId: t.String()
    })
  })
  
  // Get single lesson
  .get('/:id', async ({ params: { id } }) => {
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);
    
    if (!lesson.length) {
      throw new Error('Lesson not found');
    }
    
    return lesson[0];
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  // Create new lesson
  .post('/', async ({ body }) => {
    const lessonId = createId();
    const slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Get the max order for the course
    const maxOrder = await db
      .select({ maxOrder: lessons.order })
      .from(lessons)
      .where(eq(lessons.courseId, body.courseId))
      .orderBy(desc(lessons.order))
      .limit(1);
    
    const order = (maxOrder[0]?.maxOrder || 0) + 1;
    
    const newLesson = await db
      .insert(lessons)
      .values({
        id: lessonId,
        courseId: body.courseId,
        title: body.title,
        slug,
        description: body.description,
        type: body.type,
        content: body.content,
        videoUrl: body.videoUrl,
        duration: body.duration,
        order,
        isFree: body.isFree || false,
        resources: body.resources || [],
      })
      .returning();
    
    return newLesson[0];
  }, {
    body: t.Object({
      courseId: t.String(),
      title: t.String(),
      description: t.Optional(t.String()),
      type: t.Union([t.Literal('video'), t.Literal('text'), t.Literal('quiz'), t.Literal('assignment')]),
      content: t.Optional(t.String()),
      videoUrl: t.Optional(t.String()),
      duration: t.Optional(t.String()),
      isFree: t.Optional(t.Boolean()),
      resources: t.Optional(t.Array(t.Object({
        title: t.String(),
        url: t.String(),
        type: t.String(),
      }))),
    })
  })
  
  // Update lesson
  .put('/:id', async ({ params: { id }, body }) => {
    const updatedLesson = await db
      .update(lessons)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();
    
    if (!updatedLesson.length) {
      throw new Error('Lesson not found');
    }
    
    return updatedLesson[0];
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      content: t.Optional(t.String()),
      videoUrl: t.Optional(t.String()),
      duration: t.Optional(t.String()),
      order: t.Optional(t.Number()),
      isFree: t.Optional(t.Boolean()),
      resources: t.Optional(t.Array(t.Object({
        title: t.String(),
        url: t.String(),
        type: t.String(),
      }))),
    })
  })
  
  // Mark lesson as complete
  .post('/:id/complete', async ({ params: { id }, body }) => {
    // In a real app, we'd get the user ID from the auth token
    const { userId, enrollmentId } = body;
    
    // Check if already completed
    const existing = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, id)
        )
      )
      .limit(1);
    
    if (existing.length > 0 && existing[0].completedAt) {
      return existing[0];
    }
    
    // Create or update progress
    const progressId = existing.length > 0 ? existing[0].id : createId();
    
    if (existing.length > 0) {
      const updated = await db
        .update(lessonProgress)
        .set({
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(lessonProgress.id, progressId))
        .returning();
      
      return updated[0];
    } else {
      const created = await db
        .insert(lessonProgress)
        .values({
          id: progressId,
          userId,
          lessonId: id,
          enrollmentId,
          completedAt: new Date(),
        })
        .returning();
      
      return created[0];
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      userId: t.String(),
      enrollmentId: t.String(),
    })
  })
  
  // Delete lesson
  .delete('/:id', async ({ params: { id } }) => {
    const deleted = await db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning();
    
    if (!deleted.length) {
      throw new Error('Lesson not found');
    }
    
    return { success: true, deletedId: id };
  }, {
    params: t.Object({
      id: t.String()
    })
  });