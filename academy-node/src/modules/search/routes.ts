import express from 'express';
import { db } from '../../../db';
import { courses, lessons, users } from '../../../db/schema';
import { or, ilike, sql, and, eq } from 'drizzle-orm';

export const searchRoutes = express.Router();

// Search courses with advanced filtering
searchRoutes.get('/courses', async (req, res) => {
  try {
    const { q, category, level, minRating, maxPrice, instructor, tags } =
      req.query;

    const conditions = [];

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
      conditions.push(eq(courses.category, category as string));
    }

    // Level filter
    if (level) {
      conditions.push(
        eq(courses.level, level as 'beginner' | 'intermediate' | 'advanced')
      );
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
      const tagArray = (tags as string).split(',');
      conditions.push(
        sql`${courses.tags} @> ${JSON.stringify(tagArray)}::jsonb`
      );
    }

    // Instructor filter
    if (instructor) {
      conditions.push(ilike(users.name, `%${instructor}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build the query with instructor join
    const coursesQuery = db
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

    // Sort by relevance (if searching) or by creation date
    if (q) {
      // Simple relevance scoring based on title match
      const results = await coursesQuery.orderBy(
        sql`
          CASE
            WHEN ${courses.title} ILIKE ${q + '%'} THEN 1
            WHEN ${courses.title} ILIKE ${'%' + q + '%'} THEN 2
            ELSE 3
          END
        `,
        courses.rating
      );

      res.json({
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
      });
    } else {
      const results = await coursesQuery.orderBy(
        courses.isFeatured,
        courses.rating,
        courses.createdAt
      );

      res.json({
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
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search lessons within courses
searchRoutes.get('/lessons', async (req, res) => {
  try {
    const { q, courseId, type } = req.query;

    const conditions = [];

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
      conditions.push(eq(lessons.courseId, courseId as string));
    }

    // Type filter
    if (type) {
      conditions.push(
        eq(lessons.type, type as 'video' | 'text' | 'quiz' | 'assignment')
      );
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

    res.json({
      results: results.map((r) => ({
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
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Global search (search across courses, lessons, and instructors)
searchRoutes.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      res.json({
        courses: [],
        lessons: [],
        instructors: [],
        total: 0,
        query: '',
      });
      return;
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
        or(ilike(courses.title, `%${q}%`), ilike(courses.description, `%${q}%`))
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
        or(ilike(lessons.title, `%${q}%`), ilike(lessons.description, `%${q}%`))
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
          or(ilike(users.name, `%${q}%`), ilike(users.bio, `%${q}%`))
        )
      )
      .limit(5);

    res.json({
      courses: courseResults,
      lessons: lessonResults,
      instructors: instructorResults,
      total:
        courseResults.length + lessonResults.length + instructorResults.length,
      query: q,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get search suggestions (autocomplete)
searchRoutes.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      res.json([]);
      return;
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

    res.json([...suggestions, ...categorySuggestions, ...tagSuggestions]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
