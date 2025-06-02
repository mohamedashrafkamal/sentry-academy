import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { courseRoutes } from './src/modules/courses/routes';
import { lessonRoutes } from './src/modules/lessons/routes';
import { userRoutes } from './src/modules/users/routes';
import { enrollmentRoutes } from './src/modules/enrollments/routes';
import { searchRoutes } from './src/modules/search/routes';

const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Frontend URLs
    credentials: true
  }))
  .get('/', () => ({ message: 'Sentry Academy API', version: '1.0.0' }))
  .group('/api', app => app
    .use(courseRoutes)
    .use(lessonRoutes)
    .use(userRoutes)
    .use(enrollmentRoutes)
    .use(searchRoutes)
  )
  .onError(({ code, error }) => {
    console.error(`Error ${code}:`, error);
    return {
      error: true,
      message: error.message || 'Internal server error',
      code
    };
  })
  .listen(process.env.PORT || 3001);

console.log(`🦊 Sentry Academy API running at ${app.server?.hostname}:${app.server?.port}`);