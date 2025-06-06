import express from 'express';
import { db } from '../../../db';
import { courses, lessons, users, categories } from '../../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import * as Sentry from '@sentry/node';

const { logger } = Sentry;

export const courseRoutes = express.Router();

// Get all courses
courseRoutes.get('/courses', async (req, res) => {
  try {
    const { category, level, featured } = req.query;

    console.log('Courses query params:', { category, level, featured });

    const conditions = [];
    if (category) conditions.push(eq(courses.category, category as string));
    if (level)
      conditions.push(
        eq(courses.level, level as 'beginner' | 'intermediate' | 'advanced')
      );
    if (featured === 'true') conditions.push(eq(courses.isFeatured, true));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    console.log('Building query with conditions:', conditions.length);

    const courseList = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        instructor: users.name,
        instructorId: courses.instructorId,
        thumbnail: courses.thumbnail,
        category: courses.category,
        tags: courses.tags,
        level: courses.level,
        duration: courses.duration,
        price: courses.price,
        rating: courses.rating,
        reviewCount: courses.reviewCount,
        enrollmentCount: courses.enrollmentCount,
        isFeatured: courses.isFeatured,
        createdAt: courses.createdAt,
        publishedAt: courses.publishedAt,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(whereClause)
      .orderBy(desc(courses.createdAt));

    console.log('Query completed, returning', courseList.length, 'courses');
    logger.info(
      logger.fmt`Query completed, returning ${courseList.length} courses`
    );
    res.json(courseList);
  } catch (error) {
    console.error('Database error in courses route:', error);
    res.status(500).json({ error: 'Failed to retrieve courses from database' });
  }
});

// Get categories - MOVED BEFORE /:id route to prevent conflicts
courseRoutes.get('/courses/categories', async (req, res) => {
  try {
    const categoryList = await db
      .select()
      .from(categories)
      .orderBy(categories.order, categories.name);

    res.json(categoryList);
  } catch (error) {
    console.error('Database error in categories route:', error);
    res
      .status(500)
      .json({ error: 'Failed to retrieve categories from database' });
  }
});

// Get single course by ID
courseRoutes.get('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        instructor: users.name,
        instructorId: courses.instructorId,
        instructorBio: users.bio,
        instructorAvatar: users.avatarUrl,
        thumbnail: courses.thumbnail,
        category: courses.category,
        tags: courses.tags,
        level: courses.level,
        duration: courses.duration,
        price: courses.price,
        rating: courses.rating,
        reviewCount: courses.reviewCount,
        enrollmentCount: courses.enrollmentCount,
        isFeatured: courses.isFeatured,
        prerequisites: courses.prerequisites,
        learningObjectives: courses.learningObjectives,
        createdAt: courses.createdAt,
        publishedAt: courses.publishedAt,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.id, id))
      .limit(1);

    if (!course.length) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Get lessons for this course
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, id))
      .orderBy(lessons.order);

    res.json({
      ...course[0],
      lessons: courseLessons,
    });
  } catch (error) {
    console.error('Database error in course by ID route:', error);
    res.status(500).json({ error: 'Failed to retrieve course from database' });
  }
});

// Create a new course (for instructors/admins)
courseRoutes.post('/courses', async (req, res) => {
  const { body } = req;
  const courseId = createId();
  const slug = body.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const newCourse = await db
    .insert(courses)
    .values({
      id: courseId,
      title: body.title,
      slug,
      description: body.description,
      instructorId: body.instructorId,
      thumbnail: body.thumbnail,
      category: body.category,
      tags: body.tags || [],
      level: body.level,
      duration: body.duration,
      price: body.price || '0',
      prerequisites: body.prerequisites || [],
      learningObjectives: body.learningObjectives || [],
    })
    .returning();

  res.status(201).json(newCourse[0]);
});

// Update course
courseRoutes.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const updatedCourse = await db
    .update(courses)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id))
    .returning();

  if (!updatedCourse.length) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  res.json(updatedCourse[0]);
});
