import { Elysia, t } from 'elysia';
import { db, courses, lessons, users, categories } from '../../../db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const courseRoutes = new Elysia({ prefix: '/courses' })
  // Get all courses
  .get('/', async ({ query }) => {
    try {
      const { category, level, featured } = query;
      
      console.log('Courses query params:', { category, level, featured });
      
      let conditions = [];
      if (category) conditions.push(eq(courses.category, category));
      if (level) conditions.push(eq(courses.level, level));
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
      return courseList;
    } catch (error) {
      console.error('Database error in courses route:', error);
      throw new Error('Failed to retrieve courses from database');
    }
  }, {
    query: t.Object({
      category: t.Optional(t.String()),
      level: t.Optional(t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')])),
      featured: t.Optional(t.String())
    })
  })
  
  // Get single course by ID
  .get('/:id', async ({ params: { id } }) => {
    try {
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
        throw new Error('Course not found');
      }
      
      // Get lessons for this course
      const courseLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, id))
        .orderBy(lessons.order);
      
      return {
        ...course[0],
        lessons: courseLessons
      };
    } catch (error) {
      console.error('Database error in course by ID route:', error);
      throw new Error('Failed to retrieve course from database');
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  // Create a new course (for instructors/admins)
  .post('/', async ({ body }) => {
    const courseId = createId();
    const slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
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
    
    return newCourse[0];
  }, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      instructorId: t.String(),
      thumbnail: t.Optional(t.String()),
      category: t.String(),
      tags: t.Optional(t.Array(t.String())),
      level: t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')]),
      duration: t.Optional(t.String()),
      price: t.Optional(t.String()),
      prerequisites: t.Optional(t.Array(t.String())),
      learningObjectives: t.Optional(t.Array(t.String())),
    })
  })
  
  // Update course
  .put('/:id', async ({ params: { id }, body }) => {
    const updatedCourse = await db
      .update(courses)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();
    
    if (!updatedCourse.length) {
      throw new Error('Course not found');
    }
    
    return updatedCourse[0];
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      thumbnail: t.Optional(t.String()),
      category: t.Optional(t.String()),
      tags: t.Optional(t.Array(t.String())),
      level: t.Optional(t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')])),
      duration: t.Optional(t.String()),
      price: t.Optional(t.String()),
      isFeatured: t.Optional(t.Boolean()),
      prerequisites: t.Optional(t.Array(t.String())),
      learningObjectives: t.Optional(t.Array(t.String())),
    })
  })
  
  // Get categories
  .get('/categories', async () => {
    try {
      const categoryList = await db
        .select()
        .from(categories)
        .orderBy(categories.order, categories.name);
      
      return categoryList;
    } catch (error) {
      console.error('Database error in categories route:', error);
      throw new Error('Failed to retrieve categories from database');
    }
  });