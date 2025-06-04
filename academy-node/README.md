# Academy Node

A Node.js-based backend for the Sentry Academy application, converted from the original Bun implementation.

## Features

- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Sentry** error monitoring and logging
- RESTful API endpoints for courses, lessons, users, enrollments, and search

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your database connection in the environment or database configuration.

3. Run database migrations:
```bash
npm run db:migrate
```

4. Seed the database (optional):
```bash
npm run db:seed
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

### Production

Build and start the production server:
```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript
- `npm run db:generate` - Generate database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed database with sample data
- `npm run db:create-readonly-user` - Create readonly database user

## API Endpoints

### Courses
- `GET /api/courses` - Get all courses (with optional filters)
- `GET /api/courses/categories` - Get course categories
- `GET /api/courses/:id` - Get specific course with lessons
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course

### Lessons
- `GET /api/lessons/course/:courseId` - Get lessons for a course
- `GET /api/lessons/:id` - Get specific lesson
- `POST /api/lessons` - Create new lesson
- `PUT /api/lessons/:id` - Update lesson
- `POST /api/lessons/:id/complete` - Mark lesson as complete
- `DELETE /api/lessons/:id` - Delete lesson

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Enrollments
- `GET /api/enrollments/user/:userId` - Get user enrollments
- `POST /api/enrollments` - Create new enrollment
- `PUT /api/enrollments/:id` - Update enrollment

### Search
- `GET /api/search` - Search courses and lessons

## Environment Variables

Configure these environment variables as needed:

- `PORT` - Server port (default: 3001)
- Database connection settings (configure in drizzle config)
- Sentry DSN for error monitoring

## Architecture

This is a Node.js/Express equivalent of the original Bun/Elysia server, maintaining the same API structure and database schema while using Node.js-compatible packages and patterns.