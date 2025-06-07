import express from 'express';
import { db } from '../../../db';
import { courses, users } from '../../../db/schema';
import { or, ilike, eq } from 'drizzle-orm';

export const searchRoutes = express.Router();

// Search courses endpoint - expects 'q' parameter but frontend sends 'query'
searchRoutes.get('/search/courses', async (req, res) => {
  try {
    // Backend expects parameter to be named 'q' (common search convention)
    const { q } = req.query;
    
    console.log('Backend received query parameters:', req.query);
    console.log('Backend looking for "q" parameter, got:', q);
    
    // Realistic API validation - backend expects 'q' parameter
    if (!q || typeof q !== 'string') {
      // This will throw when frontend sends 'query' instead of 'q'
      throw new Error(`Missing required parameter 'q'. Received parameters: ${Object.keys(req.query).join(', ')}`);
    }

    console.log(`Backend searching for: "${q}"`);

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

    console.log(`Backend found ${results.length} results`);
    
    res.json({
      results,
      total: results.length,
      query: q
    });

  } catch (error: any) {
    console.error('Search API Error:', error.message);
    throw new Error(error.message);
  }
});
