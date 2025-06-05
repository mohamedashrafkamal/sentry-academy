import express from 'express';
import { db } from '../../../db';
import { lessons, lessonProgress } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const lessonRoutes = express.Router();

// Get lessons by course
lessonRoutes.get('/lessons/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);

  res.json(courseLessons);
});

// Get single lesson
lessonRoutes.get('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const lesson = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson.length) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  res.json(lesson[0]);
});

// Create new lesson
lessonRoutes.post('/lessons', async (req, res) => {
  const { body } = req;
  const lessonId = createId();
  const slug = body.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

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

  res.status(201).json(newLesson[0]);
});

// Update lesson
lessonRoutes.put('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const updatedLesson = await db
    .update(lessons)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, id))
    .returning();

  if (!updatedLesson.length) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  res.json(updatedLesson[0]);
});

// Mark lesson as complete
lessonRoutes.post('/lessons/:id/complete', async (req, res) => {
  const { id } = req.params;
  // In a real app, we'd get the user ID from the auth token
  const { userId, enrollmentId } = req.body;

  // Check if already completed
  const existing = await db
    .select()
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, id))
    )
    .limit(1);

  if (existing.length > 0 && existing[0].completedAt) {
    res.json(existing[0]);
    return;
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

    res.json(updated[0]);
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

    res.json(created[0]);
  }
});

// Delete lesson
lessonRoutes.delete('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await db
    .delete(lessons)
    .where(eq(lessons.id, id))
    .returning();

  if (!deleted.length) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  res.json({ success: true, deletedId: id });
});
