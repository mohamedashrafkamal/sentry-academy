import { Elysia, t } from 'elysia';
import { db, courses, lessons, users } from '../../../db';
import { or, ilike, sql, and, eq } from 'drizzle-orm';

export const searchRoutes = new Elysia({ prefix: '/search' })
  // Search courses with advanced filtering
  .get('/courses', async ({ query }) => {
    const { q, category, level, minRating, maxPrice, instructor, tags } = query;
    
    let conditions = [];
    
    // Text search in title, description, and tags
    if (q) {
      conditions.push(
        or(
          ilike(courses.title, `%${q}%`),
          ilike(courses.description, `%${q}%`),
          sql`${courses.tags}::text ilike ${'%' + q + '%'}`
        )
      );
    }
    
    // Category filter
    if (category) {
      conditions.push(eq(courses.category, category));
    }
    
    // Level filter
    if (level) {
      conditions.push(eq(courses.level, level));
    }
    
    // Rating filter
    if (minRating) {
      conditions.push(sql`${courses.rating} >= ${minRating}`);
    }
    
    // Price filter
    if (maxPrice !== undefined) {
      conditions.push(sql`${courses.price} <= ${maxPrice}`);
    }
    
    // Tags filter (array contains)
    if (tags) {
      const tagArray = tags.split(',');
      conditions.push(
        sql`${courses.tags} @> ${JSON.stringify(tagArray)}::jsonb`
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Build the query with instructor join
    let coursesQuery = db
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
      .where(whereClause);
    
    // Apply instructor filter after join
    if (instructor) {
      coursesQuery = coursesQuery.where(
        and(
          whereClause,
          ilike(users.name, `%${instructor}%`)
        )
      );
    }
    
    // Sort by relevance (if searching) or by creation date
    if (q) {
      // Simple relevance scoring based on title match
      coursesQuery = coursesQuery.orderBy(
        sql`
          CASE 
            WHEN ${courses.title} ILIKE ${q + '%'} THEN 1
            WHEN ${courses.title} ILIKE ${'%' + q + '%'} THEN 2
            ELSE 3
          END
        `,
        courses.rating
      );
    } else {
      coursesQuery = coursesQuery.orderBy(
        courses.isFeatured,
        courses.rating,
        courses.createdAt
      );
    }
    
    const results = await coursesQuery;
    
    return {
      results,
      total: results.length,
      query: q || '',
      filters: {
        category,
        level,
        minRating,
        maxPrice,
        instructor,
        tags,
      },
    };
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      category: t.Optional(t.String()),
      level: t.Optional(t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')])),
      minRating: t.Optional(t.Number()),
      maxPrice: t.Optional(t.Number()),
      instructor: t.Optional(t.String()),
      tags: t.Optional(t.String()),
    })
  })
  
  // Search lessons within courses
  .get('/lessons', async ({ query }) => {
    const { q, courseId, type } = query;
    
    let conditions = [];
    
    // Text search in title, description, and content
    if (q) {
      conditions.push(
        or(
          ilike(lessons.title, `%${q}%`),
          ilike(lessons.description, `%${q}%`),
          ilike(lessons.content, `%${q}%`)
        )
      );
    }
    
    // Course filter
    if (courseId) {
      conditions.push(eq(lessons.courseId, courseId));
    }
    
    // Type filter
    if (type) {
      conditions.push(eq(lessons.type, type));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const results = await db
      .select({
        lesson: lessons,
        course: courses,
      })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(whereClause)
      .orderBy(lessons.order);
    
    return {
      results: results.map(r => ({
        ...r.lesson,
        courseName: r.course.title,
        courseSlug: r.course.slug,
      })),
      total: results.length,
      query: q || '',
      filters: {
        courseId,
        type,
      },
    };
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      courseId: t.Optional(t.String()),
      type: t.Optional(t.Union([t.Literal('video'), t.Literal('text'), t.Literal('quiz'), t.Literal('assignment')])),
    })
  })
  
  // Global search (search across courses, lessons, and instructors)
  .get('/', async ({ query: { q } }) => {
    if (!q) {
      return {
        courses: [],
        lessons: [],
        instructors: [],
        total: 0,
        query: '',
      };
    }
    
    // Search courses
    const courseResults = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        thumbnail: courses.thumbnail,
        category: courses.category,
        rating: courses.rating,
        type: sql<string>`'course'`,
      })
      .from(courses)
      .where(
        or(
          ilike(courses.title, `%${q}%`),
          ilike(courses.description, `%${q}%`)
        )
      )
      .limit(10);
    
    // Search lessons
    const lessonResults = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        courseId: lessons.courseId,
        type: sql<string>`'lesson'`,
      })
      .from(lessons)
      .where(
        or(
          ilike(lessons.title, `%${q}%`),
          ilike(lessons.description, `%${q}%`)
        )
      )
      .limit(10);
    
    // Search instructors
    const instructorResults = await db
      .select({
        id: users.id,
        name: users.name,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        type: sql<string>`'instructor'`,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'instructor'),
          or(
            ilike(users.name, `%${q}%`),
            ilike(users.bio, `%${q}%`)
          )
        )
      )
      .limit(5);
    
    return {
      courses: courseResults,
      lessons: lessonResults,
      instructors: instructorResults,
      total: courseResults.length + lessonResults.length + instructorResults.length,
      query: q,
    };
  }, {
    query: t.Object({
      q: t.String(),
    })
  })
  
  // Get search suggestions (autocomplete)
  .get('/suggestions', async ({ query: { q } }) => {
    if (!q || q.length < 2) {
      return [];
    }
    
    // Get course title suggestions
    const suggestions = await db
      .select({
        value: courses.title,
        type: sql<string>`'course'`,
      })
      .from(courses)
      .where(ilike(courses.title, `${q}%`))
      .limit(5);
    
    // Get category suggestions
    const categorySuggestions = await db
      .selectDistinct({
        value: courses.category,
        type: sql<string>`'category'`,
      })
      .from(courses)
      .where(ilike(courses.category, `${q}%`))
      .limit(3);
    
    // Get tag suggestions
    const tagSuggestions = await db
      .select({
        value: sql<string>`DISTINCT jsonb_array_elements_text(${courses.tags})`,
        type: sql<string>`'tag'`,
      })
      .from(courses)
      .where(sql`jsonb_array_elements_text(${courses.tags}) ILIKE ${q + '%'}`)
      .limit(3);
    
    return [...suggestions, ...categorySuggestions, ...tagSuggestions];
  }, {
    query: t.Object({
      q: t.String(),
    })
  });