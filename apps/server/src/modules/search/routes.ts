import express from 'express';
import { db } from '../../../db';
import { courses, users } from '../../../db/schema';
import { or, ilike, eq } from 'drizzle-orm';

export const searchRoutes = express.Router();

// TOFIX Module 2: Search courses endpoint - expects 'q' parameter but frontend sends 'query'
searchRoutes.get('/search/courses', async (req, res) => {
  try {
    const { q } = req.query;
    
    // Realistic API validation - backend expects 'q' parameter
    if (!q || typeof q !== 'string') {
      // This will throw when frontend sends 'query' instead of 'q'
      throw new Error(`Missing required parameter 'q'. Received parameters: ${Object.keys(req.query).join(', ')}`);
    }

    // Simple search implementation
    const results = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        instructor: users.name,
        thumbnail: courses.thumbnail,
        category: courses.category,
        level: courses.level,
        duration: courses.duration,
        price: courses.price,
        rating: courses.rating,
        reviewCount: courses.reviewCount,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(
        or(
          ilike(courses.title, `%${q}%`),
          ilike(courses.description, `%${q}%`)
        )
      )
      .orderBy(courses.rating)
      .limit(50);
    
    const responseData = {
      results,
      total: results.length,
      query: q
    };

    res.json(responseData);

  } catch (error: any) {
    throw new Error(error.message);
  }
});
