#!/usr/bin/env bun
import { db, users, courses, lessons, categories } from "./db/index.ts";
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

async function addMissingCourses() {
  try {
    console.log('🔍 Adding missing courses...');
    
    // Get current instructors
    const instructors = await db.select().from(users).where(eq(users.role, 'instructor'));
    console.log('Found instructors:', instructors.map(i => i.name));
    
    // Map instructor names to IDs
    const instructorMap = new Map(instructors.map(user => [user.name, user.id]));
    
    // Add AI/ML category if missing
    await db.insert(categories).values({
      id: createId(),
      name: 'AI/ML',
      slug: 'ai-ml',
      icon: '🤖',
      order: 5,
      description: 'Learn about AI and Machine Learning observability',
    }).onConflictDoNothing();
    
    // Define new courses to add
    const newCourses = [
      {
        title: 'Distributed Tracing Systems',
        slug: 'distributed-tracing-systems',
        description: 'Understand and implement distributed tracing in microservice architectures.',
        instructor: 'Paul Jaffre',
        thumbnail: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
        category: 'Observability',
        tags: ['tracing', 'microservices', 'distributed-systems'],
        level: 'advanced' as const,
        duration: '15 hours',
        price: '99.99',
        rating: '4.9',
        reviewCount: 74,
        enrollmentCount: 450,
        isFeatured: false,
      },
      {
        title: 'Frontend Error Monitoring',
        slug: 'frontend-error-monitoring',
        description: 'Learn how to effectively monitor and debug client-side errors in web applications.',
        instructor: 'Cody De Arkland',
        thumbnail: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
        category: 'Error Handling',
        tags: ['frontend', 'javascript', 'debugging', 'user-experience'],
        level: 'intermediate' as const,
        duration: '6 hours',
        price: '59.99',
        rating: '4.6',
        reviewCount: 62,
        enrollmentCount: 380,
        isFeatured: false,
      },
      {
        title: 'Log Analysis and Visualization',
        slug: 'log-analysis-and-visualization',
        description: 'Master the techniques of extracting valuable insights from application logs using modern analysis tools.',
        instructor: 'Kyle Tryon',
        thumbnail: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg',
        category: 'Observability',
        tags: ['logs', 'analysis', 'visualization', 'dashboards'],
        level: 'intermediate' as const,
        duration: '9 hours',
        price: '69.99',
        rating: '4.8',
        reviewCount: 89,
        enrollmentCount: 520,
        isFeatured: true,
      },
      {
        title: 'Basics of Error Monitoring',
        slug: 'basics-of-error-monitoring',
        description: 'Learn the fundamentals of error monitoring and how to set up effective error tracking for your applications.',
        instructor: 'Lazar Nikolov',
        thumbnail: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg',
        category: 'Error Handling',
        tags: ['error-monitoring', 'sentry', 'debugging', 'fundamentals'],
        level: 'beginner' as const,
        duration: '6 hours',
        price: '49.99',
        rating: '4.8',
        reviewCount: 156,
        enrollmentCount: 890,
        isFeatured: true,
      },
      {
        title: 'Understanding and implementing Session Replay',
        slug: 'understanding-and-implementing-session-replay',
        description: 'Master session replay technology to understand user interactions and debug issues with complete context.',
        instructor: 'Paul Jaffre',
        thumbnail: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg',
        category: 'Observability',
        tags: ['session-replay', 'user-experience', 'debugging', 'frontend'],
        level: 'intermediate' as const,
        duration: '8 hours',
        price: '79.99',
        rating: '4.9',
        reviewCount: 112,
        enrollmentCount: 650,
        isFeatured: true,
      },
      {
        title: 'Using Tracing and Spans for Performance',
        slug: 'using-tracing-and-spans-for-performance',
        description: 'Deep dive into distributed tracing and spans to understand and optimize application performance across services.',
        instructor: 'Cody De Arkland',
        thumbnail: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
        category: 'Performance',
        tags: ['tracing', 'spans', 'distributed-systems', 'performance'],
        level: 'advanced' as const,
        duration: '10 hours',
        price: '99.99',
        rating: '4.7',
        reviewCount: 94,
        enrollmentCount: 450,
        isFeatured: false,
      },
      {
        title: 'Observability for AI applications',
        slug: 'observability-for-ai-applications',
        description: 'Learn specialized observability techniques for AI and machine learning applications, including model monitoring and performance tracking.',
        instructor: 'Kyle Tryon',
        thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
        category: 'AI/ML',
        tags: ['ai', 'machine-learning', 'model-monitoring', 'observability'],
        level: 'advanced' as const,
        duration: '12 hours',
        price: '129.99',
        rating: '4.9',
        reviewCount: 87,
        enrollmentCount: 320,
        isFeatured: true,
      },
    ];
    
    // Add each new course
    for (const courseData of newCourses) {
      const instructorId = instructorMap.get(courseData.instructor);
      if (!instructorId) {
        console.log(`⚠️  Instructor not found: ${courseData.instructor}`);
        continue;
      }
      
      const existingCourse = await db.select().from(courses).where(eq(courses.title, courseData.title)).limit(1);
      if (existingCourse.length > 0) {
        console.log(`⚠️  Course already exists: ${courseData.title}`);
        continue;
      }
      
      const courseId = createId();
      await db.insert(courses).values({
        id: courseId,
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        instructorId: instructorId,
        thumbnail: courseData.thumbnail,
        category: courseData.category,
        tags: courseData.tags,
        level: courseData.level,
        duration: courseData.duration,
        price: courseData.price,
        rating: courseData.rating,
        reviewCount: courseData.reviewCount,
        enrollmentCount: courseData.enrollmentCount,
        isFeatured: courseData.isFeatured,
        status: 'published',
        publishedAt: new Date(),
      });
      
      console.log(`✅ Added course: ${courseData.title} (${courseData.instructor})`);
      
      // Add a few sample lessons for each course
      const sampleLessons = [
        {
          title: `Introduction to ${courseData.title}`,
          description: `Get started with ${courseData.title}`,
          isFree: true,
        },
        {
          title: `Core Concepts`,
          description: `Learn the core concepts and fundamentals`,
          isFree: false,
        },
        {
          title: `Practical Implementation`,
          description: `Hands-on implementation and best practices`,
          isFree: false,
        },
      ];
      
      for (let i = 0; i < sampleLessons.length; i++) {
        const lesson = sampleLessons[i];
        await db.insert(lessons).values({
          id: createId(),
          courseId: courseId,
          title: lesson.title,
          slug: lesson.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: lesson.description,
          type: 'text',
          content: `# ${lesson.title}\n\nThis lesson content will be populated later.`,
          duration: i === 0 ? '30 min' : '45 min',
          order: i + 1,
          isFree: lesson.isFree,
        });
      }
    }
    
    console.log('🎉 Successfully added missing courses!');
    
    // Final verification
    const allCourses = await db
      .select({
        title: courses.title,
        instructor: users.name,
        category: courses.category,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id));
      
    console.log('\n📚 All courses in database:');
    allCourses.forEach(course => {
      console.log(`  - ${course.title} (${course.instructor}) - ${course.category}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding courses:', error);
  }
  
  process.exit(0);
}

addMissingCourses();