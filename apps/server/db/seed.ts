import { db, users, courses, lessons, categories } from './index';
import { createId } from '@paralleldrive/cuid2';
import { performanceLessonsContent } from './lesson-content';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Create categories
    const categoriesData = [
      { name: 'Observability', slug: 'observability', icon: '🔍', order: 1 },
      { name: 'Error Handling', slug: 'error-handling', icon: '🐛', order: 2 },
      { name: 'Performance', slug: 'performance', icon: '⚡', order: 3 },
      { name: 'Security', slug: 'security', icon: '🔒', order: 4 },
      { name: 'AI/ML', slug: 'ai-ml', icon: '🤖', order: 5 },
    ];
    
    console.log('Creating categories...');
    for (const cat of categoriesData) {
      await db.insert(categories).values({
        id: createId(),
        ...cat,
        description: `Learn about ${cat.name} best practices`,
      }).onConflictDoNothing();
    }
    
    // Create instructors
    const instructors = [
      {
        id: createId(),
        email: 'cody.dearkland@sentryacademy.com',
        name: 'Cody De Arkland',
        role: 'instructor' as const,
        bio: 'Senior Developer Advocate specializing in observability and monitoring',
        avatarUrl: 'https://ui-avatars.com/api/?name=CD&background=0ea5e9&color=fff&size=128',
      },
      {
        id: createId(),
        email: 'kyle.tryon@sentryacademy.com',
        name: 'Kyle Tryon',
        role: 'instructor' as const,
        bio: 'Error tracking expert with 10+ years of experience',
        avatarUrl: 'https://ui-avatars.com/api/?name=KT&background=22c55e&color=fff&size=128',
      },
      {
        id: createId(),
        email: 'lazar.nikolov@sentryacademy.com',
        name: 'Lazar Nikolov',
        role: 'instructor' as const,
        bio: 'Performance optimization specialist',
        avatarUrl: 'https://ui-avatars.com/api/?name=LN&background=f59e0b&color=fff&size=128',
      },
      {
        id: createId(),
        email: 'paul.jaffre@sentryacademy.com',
        name: 'Paul Jaffre',
        role: 'instructor' as const,
        bio: 'Expert instructor at Sentry Academy',
        avatarUrl: 'https://ui-avatars.com/api/?name=PJ&background=8b5cf6&color=fff&size=128',
      },
    ];
    
    console.log('Creating instructors...');
    for (const instructor of instructors) {
      await db.insert(users).values(instructor).onConflictDoNothing();
    }
    
    // Create courses with updated instructor assignments
    const coursesData = [
      {
        id: createId(),
        title: 'Fundamentals of Observability',
        slug: 'fundamentals-of-observability',
        description: 'Learn the core concepts of observability and how to implement them in your applications.',
        instructorId: instructors[0].id, // Cody De Arkland
        thumbnail: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg',
        category: 'Observability',
        tags: ['monitoring', 'logs', 'metrics', 'tracing'],
        level: 'beginner' as const,
        duration: '8 hours',
        price: '49.99',
        rating: '4.9',
        reviewCount: 128,
        enrollmentCount: 1250,
        isFeatured: true,
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Advanced Error Tracking',
        slug: 'advanced-error-tracking',
        description: 'Master the art of error tracking and debugging in complex applications.',
        instructorId: instructors[1].id, // Kyle Tryon
        thumbnail: 'https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg',
        category: 'Error Handling',
        tags: ['errors', 'debugging', 'exceptions', 'troubleshooting'],
        level: 'intermediate' as const,
        duration: '10 hours',
        price: '79.99',
        rating: '4.8',
        reviewCount: 95,
        enrollmentCount: 890,
        isFeatured: true,
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Performance Optimization Techniques',
        slug: 'performance-optimization-techniques',
        description: 'Learn how to identify and resolve performance bottlenecks in your applications.',
        instructorId: instructors[2].id, // Lazar Nikolov
        thumbnail: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
        category: 'Performance',
        tags: ['optimization', 'profiling', 'metrics', 'bottlenecks'],
        level: 'advanced' as const,
        duration: '12 hours',
        price: '99.99',
        rating: '4.7',
        reviewCount: 83,
        enrollmentCount: 650,
        isFeatured: true,
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Distributed Tracing Systems',
        slug: 'distributed-tracing-systems',
        description: 'Understand and implement distributed tracing in microservice architectures.',
        instructorId: instructors[3].id, // Paul Jaffre
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Frontend Error Monitoring',
        slug: 'frontend-error-monitoring',
        description: 'Learn how to effectively monitor and debug client-side errors in web applications.',
        instructorId: instructors[0].id, // Cody De Arkland
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Log Analysis and Visualization',
        slug: 'log-analysis-and-visualization',
        description: 'Master the techniques of extracting valuable insights from application logs using modern analysis tools.',
        instructorId: instructors[1].id, // Kyle Tryon
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Basics of Error Monitoring',
        slug: 'basics-of-error-monitoring',
        description: 'Learn the fundamentals of error monitoring and how to set up effective error tracking for your applications.',
        instructorId: instructors[2].id, // Lazar Nikolov
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Understanding and implementing Session Replay',
        slug: 'understanding-and-implementing-session-replay',
        description: 'Master session replay technology to understand user interactions and debug issues with complete context.',
        instructorId: instructors[3].id, // Paul Jaffre
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Using Tracing and Spans for Performance',
        slug: 'using-tracing-and-spans-for-performance',
        description: 'Deep dive into distributed tracing and spans to understand and optimize application performance across services.',
        instructorId: instructors[0].id, // Cody De Arkland
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
      {
        id: createId(),
        title: 'Observability for AI applications',
        slug: 'observability-for-ai-applications',
        description: 'Learn specialized observability techniques for AI and machine learning applications, including model monitoring and performance tracking.',
        instructorId: instructors[1].id, // Kyle Tryon
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
        status: 'published' as const,
        publishedAt: new Date(),
      },
    ];
    
    console.log('Creating courses...');
    for (const course of coursesData) {
      await db.insert(courses).values(course).onConflictDoNothing();
      
      // Create lessons for Performance Optimization course with rich content
      if (course.slug === 'performance-optimization-techniques') {
        console.log(`Creating detailed performance lessons for ${course.title}...`);
        
        const performanceLessons = [
          {
            id: createId(),
            courseId: course.id,
            title: 'Introduction to Performance Analysis',
            slug: 'introduction-to-performance-analysis',
            description: 'Understanding performance metrics and analysis techniques.',
            type: 'text' as const,
            content: performanceLessonsContent['3-1'],
            duration: '1 hour',
            order: 1,
            isFree: true,
          },
          {
            id: createId(),
            courseId: course.id,
            title: 'Setting Up Performance Monitoring',
            slug: 'setting-up-performance-monitoring',
            description: 'Configure comprehensive performance monitoring for your applications.',
            type: 'text' as const,
            content: performanceLessonsContent['3-2'],
            duration: '1.5 hours',
            order: 2,
            isFree: false,
          },
          {
            id: createId(),
            courseId: course.id,
            title: 'Profiling and Bottleneck Identification',
            slug: 'profiling-and-bottleneck-identification',
            description: 'Learn to use profiling tools to identify performance bottlenecks.',
            type: 'text' as const,
            content: performanceLessonsContent['3-3'],
            duration: '2 hours',
            order: 3,
            isFree: false,
          },
          {
            id: createId(),
            courseId: course.id,
            title: 'Database Performance Optimization',
            slug: 'database-performance-optimization',
            description: 'Optimize database queries and improve data access patterns.',
            type: 'text' as const,
            content: performanceLessonsContent['3-4'],
            duration: '2.5 hours',
            order: 4,
            isFree: false,
          },
          {
            id: createId(),
            courseId: course.id,
            title: 'Frontend Performance Optimization',
            slug: 'frontend-performance-optimization',
            description: 'Optimize client-side performance for better user experience.',
            type: 'text' as const,
            content: performanceLessonsContent['3-5'],
            duration: '2 hours',
            order: 5,
            isFree: false,
          },
          {
            id: createId(),
            courseId: course.id,
            title: 'Caching Strategies and Implementation',
            slug: 'caching-strategies-and-implementation',
            description: 'Master various caching techniques to improve application performance.',
            type: 'text' as const,
            content: performanceLessonsContent['3-6'],
            duration: '2 hours',
            order: 6,
            isFree: false,
          },
        ];
        
        for (const lesson of performanceLessons) {
          await db.insert(lessons).values(lesson).onConflictDoNothing();
        }
      } else {
        // Create generic lessons for other courses
        const lessonCount = Math.floor(Math.random() * 5) + 3; // 3-7 lessons per course
        console.log(`Creating ${lessonCount} lessons for ${course.title}...`);
        
        for (let i = 1; i <= lessonCount; i++) {
          await db.insert(lessons).values({
            id: createId(),
            courseId: course.id,
            title: `Lesson ${i}: ${course.title} - Part ${i}`,
            slug: `lesson-${i}`,
            description: `In this lesson, we'll cover important concepts related to ${course.title}`,
            type: i === 1 ? 'video' : (i % 2 === 0 ? 'video' : 'text'),
            content: i % 2 === 1 ? `# Lesson ${i} Content\n\nThis is the content for lesson ${i}...` : null,
            videoUrl: i % 2 === 0 ? `https://example.com/videos/course-${course.id}-lesson-${i}` : null,
            duration: i % 2 === 0 ? '45 min' : '30 min',
            order: i,
            isFree: i === 1, // First lesson is free
          }).onConflictDoNothing();
        }
      }
    }
    
    // Create a demo student
    await db.insert(users).values({
      id: createId(),
      email: 'student@example.com',
      name: 'Demo Student',
      role: 'student',
      bio: 'Learning enthusiast',
    }).onConflictDoNothing();
    
    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seed();