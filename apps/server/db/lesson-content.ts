export const performanceLessonsContent = {
    '3-1': `# Introduction to Performance Analysis
  
  ## Overview
  Performance analysis is the systematic process of measuring, evaluating, and optimizing the speed, responsiveness, and resource utilization of software applications. In today's competitive digital landscape, performance directly impacts user experience, business metrics, and operational costs.
  
  ## Key Performance Metrics
  
  ### Response Time
  - **Definition**: The time between a user action and the system response
  - **Target**: Web pages should load in under 3 seconds
  - **Impact**: 1-second delay can reduce conversions by 7%
  
  ### Throughput
  - **Definition**: Number of requests processed per unit of time
  - **Measurement**: Requests per second (RPS) or transactions per second (TPS)
  - **Importance**: Determines system capacity under load
  
  ### Resource Utilization
  - **CPU Usage**: Should remain below 80% under normal load
  - **Memory Consumption**: Monitor for memory leaks and excessive allocation
  - **Network I/O**: Track bandwidth usage and latency
  - **Disk I/O**: Monitor read/write operations and storage capacity
  
  ## Performance Analysis Process
  
  ### 1. Establish Baselines
  Before optimization, establish current performance baselines:
  - Measure key metrics under normal conditions
  - Document user workflows and expected load patterns
  - Set realistic performance targets
  
  ### 2. Identify Bottlenecks
  Use profiling tools to identify performance bottlenecks:
  - CPU-bound operations
  - Memory allocation issues
  - Network latency problems
  - Database query performance
  - Third-party service dependencies
  
  ### 3. Prioritize Optimizations
  Focus on optimizations that provide the biggest impact:
  - Address the slowest operations first
  - Consider frequency of execution
  - Evaluate implementation complexity vs. performance gain
  
  ## Common Performance Anti-Patterns
  
  ### N+1 Query Problem
  \`\`\`javascript
  // Bad: N+1 queries
  const users = await User.findAll();
  for (const user of users) {
    const posts = await Post.findAll({ where: { userId: user.id } });
  }
  
  // Good: Single query with joins
  const users = await User.findAll({
    include: [{ model: Post }]
  });
  \`\`\`
  
  ### Synchronous Blocking Operations
  \`\`\`javascript
  // Bad: Blocking operation
  const data = fs.readFileSync('large-file.txt');
  
  // Good: Non-blocking operation
  const data = await fs.promises.readFile('large-file.txt');
  \`\`\`
  
  ### Memory Leaks
  \`\`\`javascript
  // Bad: Event listener not removed
  element.addEventListener('click', handler);
  
  // Good: Cleanup event listeners
  element.addEventListener('click', handler);
  // Later...
  element.removeEventListener('click', handler);
  \`\`\`
  
  ## Tools for Performance Analysis
  
  ### Browser DevTools
  - **Network Panel**: Analyze request timing and size
  - **Performance Panel**: CPU profiling and timeline analysis
  - **Memory Panel**: Heap snapshots and memory usage
  - **Lighthouse**: Automated performance auditing
  
  ### Application Performance Monitoring (APM)
  - **Sentry Performance**: End-to-end transaction monitoring
  - **New Relic**: Full-stack performance monitoring
  - **DataDog**: Infrastructure and application metrics
  - **AppDynamics**: Business performance monitoring
  
  ### Profiling Tools
  - **Node.js**: Built-in profiler, clinic.js
  - **Python**: cProfile, line_profiler
  - **Java**: JProfiler, VisualVM
  - **Browser**: Chrome DevTools, Firefox Profiler
  
  ## Next Steps
  In the following lessons, we'll dive deeper into:
  - Setting up performance monitoring infrastructure
  - Using profiling tools effectively
  - Database optimization techniques
  - Frontend performance optimization
  - Caching strategies and implementation
  
  Understanding these fundamentals will enable you to systematically approach performance optimization and make data-driven decisions about where to focus your optimization efforts.`,
  
    '3-2': `# Setting Up Performance Monitoring
  
  ## Why Performance Monitoring Matters
  
  Performance monitoring provides continuous visibility into your application's health, helping you:
  - Detect performance regressions before users notice
  - Understand real-world usage patterns
  - Identify optimization opportunities
  - Meet SLA requirements and business objectives
  
  ## Monitoring Strategy
  
  ### 1. Define Key Performance Indicators (KPIs)
  Establish metrics that align with business goals:
  
  **User Experience Metrics:**
  - Page Load Time
  - Time to First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - First Input Delay (FID)
  
  **Business Metrics:**
  - Conversion rates
  - Bounce rates
  - User engagement
  - Revenue per page view
  
  **Technical Metrics:**
  - Server response time
  - Database query performance
  - API endpoint latency
  - Error rates
  
  ### 2. Choose Monitoring Tools
  
  **Synthetic Monitoring**
  - Simulates user interactions
  - Provides consistent baseline measurements
  - Tools: Pingdom, GTmetrix, WebPageTest
  
  **Real User Monitoring (RUM)**
  - Captures actual user experience
  - Provides real-world performance data
  - Tools: Google Analytics, Sentry, New Relic
  
  ## Implementing Sentry Performance Monitoring
  
  ### Installation and Setup
  
  \`\`\`bash
  npm install @sentry/browser @sentry/tracing
  \`\`\`
  
  \`\`\`javascript
  import * as Sentry from "@sentry/browser";
  import { Integrations } from "@sentry/tracing";
  
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    integrations: [
      new Integrations.BrowserTracing({
        tracingOrigins: ["localhost", "yourapp.com", /^\//],
      }),
    ],
    tracesSampleRate: 1.0, // Adjust for production
    environment: process.env.NODE_ENV,
  });
  \`\`\`
  
  ### Custom Performance Monitoring
  
  \`\`\`javascript
  // Transaction monitoring
  const transaction = Sentry.startTransaction({
    name: "User Checkout Process",
    op: "checkout"
  });
  
  // Set transaction on scope
  Sentry.getCurrentHub().getScope().setSpan(transaction);
  
  try {
    // Your application logic
    await processPayment();
    await updateInventory();
    await sendConfirmationEmail();
    
    transaction.setStatus("ok");
  } catch (error) {
    transaction.setStatus("internal_error");
    throw error;
  } finally {
    transaction.finish();
  }
  \`\`\`
  
  ## Best Practices
  
  ### 1. Start Simple
  Begin with basic metrics and gradually add more sophisticated monitoring.
  
  ### 2. Focus on User Impact
  Prioritize metrics that directly affect user experience.
  
  ### 3. Set Realistic Targets
  Base performance targets on user expectations and business requirements.
  
  ### 4. Monitor Continuously
  Performance monitoring should run 24/7, not just during testing.
  
  ### 5. Act on Data
  Use monitoring data to make informed optimization decisions.
  
  By implementing comprehensive performance monitoring, you'll gain the visibility needed to maintain and improve your application's performance over time.`,
  
    '3-3': `# Profiling and Bottleneck Identification
  
  ## Understanding Profiling
  
  Profiling is the process of analyzing program execution to understand where time and resources are being spent. It helps identify performance bottlenecks by providing detailed insights into:
  - Function call frequency and duration
  - Memory allocation patterns
  - CPU usage distribution
  - I/O operations and timing
  
  ## Types of Profiling
  
  ### 1. CPU Profiling
  Measures where your application spends CPU time:
  - Function execution time
  - Call stack analysis
  - Hot paths identification
  - CPU-bound operations
  
  ### 2. Memory Profiling
  Analyzes memory usage patterns:
  - Heap allocation tracking
  - Memory leak detection
  - Garbage collection impact
  - Object lifecycle analysis
  
  ### 3. I/O Profiling
  Monitors input/output operations:
  - Database query performance
  - File system operations
  - Network request timing
  - External service calls
  
  ## Browser Profiling Tools
  
  ### Chrome DevTools Performance Panel
  
  **Starting a Performance Recording:**
  1. Open Chrome DevTools (F12)
  2. Navigate to Performance panel
  3. Click record button
  4. Perform actions to profile
  5. Stop recording and analyze
  
  **Reading the Performance Timeline:**
  - **Main Thread**: JavaScript execution, parsing, layout
  - **Network**: Resource loading timeline
  - **Frames**: Rendering performance per frame
  - **Memory**: Heap usage over time
  
  ## Node.js Profiling
  
  ### Built-in Profiler
  
  \`\`\`bash
  # CPU profiling
  node --prof app.js
  
  # Generate readable report
  node --prof-process isolate-0x*.log > profile.txt
  \`\`\`
  
  ### Custom Profiling Code
  
  \`\`\`javascript
  const { performance, PerformanceObserver } = require('perf_hooks');
  
  // Mark performance points
  performance.mark('operation-start');
  await expensiveOperation();
  performance.mark('operation-end');
  
  // Measure duration
  performance.measure('operation-duration', 'operation-start', 'operation-end');
  
  // Observer for measurements
  const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      console.log(\`\${entry.name}: \${entry.duration}ms\`);
    });
  });
  obs.observe({ entryTypes: ['measure'] });
  \`\`\`
  
  ## Common Bottleneck Patterns
  
  ### 1. Inefficient Algorithms
  \`\`\`javascript
  // O(n²) - Inefficient
  function findDuplicates(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] === arr[j]) {
          duplicates.push(arr[i]);
        }
      }
    }
    return duplicates;
  }
  
  // O(n) - Efficient
  function findDuplicatesEfficient(arr) {
    const seen = new Set();
    const duplicates = new Set();
    
    for (const item of arr) {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    }
    
    return Array.from(duplicates);
  }
  \`\`\`
  
  ## Profiling Best Practices
  
  ### 1. Profile in Production-like Environment
  - Use similar data volumes
  - Replicate production load patterns
  - Include network latency
  - Use production configurations
  
  ### 2. Profile Representative Workloads
  - Real user scenarios
  - Peak load conditions
  - Edge cases and error conditions
  - Long-running operations
  
  ### 3. Baseline Before Optimization
  Establish performance baselines before making changes to measure improvements accurately.
  
  Effective profiling is an iterative process that combines tool usage with analytical thinking to systematically improve application performance.`,
  
    '3-4': `# Database Performance Optimization
  
  ## Understanding Database Performance
  
  Database performance optimization involves improving query execution speed, reducing resource consumption, and scaling data access efficiently. Poor database performance often becomes the primary bottleneck in web applications as data volumes grow.
  
  ## Query Optimization Fundamentals
  
  ### 1. Understanding Execution Plans
  
  **PostgreSQL Example:**
  \`\`\`sql
  -- Analyze query execution
  EXPLAIN ANALYZE SELECT * FROM users 
  WHERE email = 'user@example.com' 
  AND created_at > '2023-01-01';
  \`\`\`
  
  **Key Metrics to Analyze:**
  - **Seq Scan**: Full table scan (usually inefficient)
  - **Index Scan**: Using index (efficient)
  - **Cost**: Estimated execution cost
  - **Actual Time**: Real execution time
  - **Rows**: Number of rows processed
  
  ### 2. Index Strategy
  
  **Creating Effective Indexes:**
  \`\`\`sql
  -- Single column index
  CREATE INDEX idx_users_email ON users(email);
  
  -- Composite index (order matters)
  CREATE INDEX idx_users_email_created ON users(email, created_at);
  
  -- Partial index for specific conditions
  CREATE INDEX idx_active_users ON users(email) WHERE active = true;
  \`\`\`
  
  **Index Best Practices:**
  \`\`\`javascript
  // Good: Use indexed columns in WHERE clauses
  const user = await User.findOne({
    where: { email: userEmail } // email is indexed
  });
  
  // Bad: Functions prevent index usage
  const users = await User.findAll({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      userEmail.toLowerCase()
    )
  });
  \`\`\`
  
  ## Query Pattern Optimization
  
  ### 1. Solving N+1 Query Problems
  
  **Problem Example:**
  \`\`\`javascript
  // Bad: N+1 queries (1 + N where N = number of users)
  const users = await User.findAll();
  for (const user of users) {
    const posts = await Post.findAll({ where: { userId: user.id } });
    user.posts = posts;
  }
  \`\`\`
  
  **Solution - Eager Loading:**
  \`\`\`javascript
  // Good: Single query with JOIN
  const users = await User.findAll({
    include: [{
      model: Post,
      as: 'posts'
    }]
  });
  \`\`\`
  
  ### 2. Pagination Optimization
  
  **Offset-based Pagination Issues:**
  \`\`\`sql
  -- Becomes slower as offset increases
  SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 10000;
  \`\`\`
  
  **Cursor-based Pagination (Better):**
  \`\`\`javascript
  // First page
  const firstPage = await Post.findAll({
    order: [['created_at', 'DESC']],
    limit: 20
  });
  
  // Next page using cursor
  const nextPage = await Post.findAll({
    where: {
      created_at: { [Op.lt]: lastItemFromPreviousPage.created_at }
    },
    order: [['created_at', 'DESC']],
    limit: 20
  });
  \`\`\`
  
  ## Connection Pool Optimization
  
  ### 1. Pool Configuration
  
  \`\`\`javascript
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: 'localhost',
    database: 'myapp',
    user: 'dbuser',
    password: 'password',
    port: 5432,
    
    // Connection pool settings
    max: 20,        // Maximum connections
    min: 5,         // Minimum connections
    idle: 10000,    // Idle timeout (10 seconds)
    acquire: 30000, // Acquire timeout (30 seconds)
  });
  \`\`\`
  
  ## Caching Strategies
  
  ### 1. Query Result Caching
  
  \`\`\`javascript
  const Redis = require('redis');
  const client = Redis.createClient();
  
  async function getCachedUser(userId) {
    const cacheKey = \`user:\${userId}\`;
    
    // Try cache first
    const cached = await client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const user = await User.findByPk(userId);
    
    // Cache result with TTL
    await client.setex(cacheKey, 3600, JSON.stringify(user)); // 1 hour TTL
    
    return user;
  }
  \`\`\`
  
  By implementing these database optimization techniques, you can significantly improve application performance and handle larger scale efficiently. Remember to always measure before and after optimizations to validate improvements.`,
  
    '3-5': `# Frontend Performance Optimization
  
  ## Core Web Vitals and User Experience
  
  Frontend performance directly impacts user experience and business metrics. Google's Core Web Vitals provide measurable metrics that correlate with user satisfaction:
  
  - **Largest Contentful Paint (LCP)**: Loading performance (target: <2.5s)
  - **First Input Delay (FID)**: Interactivity (target: <100ms)
  - **Cumulative Layout Shift (CLS)**: Visual stability (target: <0.1)
  
  ## JavaScript Performance Optimization
  
  ### 1. Code Splitting and Lazy Loading
  
  **Route-based Code Splitting (React):**
  \`\`\`javascript
  import { lazy, Suspense } from 'react';
  import { Routes, Route } from 'react-router-dom';
  
  // Lazy load components
  const HomePage = lazy(() => import('./pages/HomePage'));
  const CoursesPage = lazy(() => import('./pages/CoursesPage'));
  const ProfilePage = lazy(() => import('./pages/ProfilePage'));
  
  function App() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    );
  }
  \`\`\`
  
  ### 2. Bundle Optimization
  
  **Tree Shaking and Dead Code Elimination:**
  \`\`\`javascript
  // Bad: Imports entire library
  import _ from 'lodash';
  const result = _.debounce(fn, 300);
  
  // Good: Import only needed functions
  import { debounce } from 'lodash-es';
  const result = debounce(fn, 300);
  
  // Even better: Use native alternatives
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  \`\`\`
  
  ## Rendering Performance
  
  ### 1. React Optimization Techniques
  
  **Memoization:**
  \`\`\`javascript
  import { memo, useMemo, useCallback } from 'react';
  
  // Memoize expensive calculations
  function ExpensiveComponent({ data, filter }) {
    const filteredData = useMemo(() => {
      return data.filter(item => item.category === filter);
    }, [data, filter]);
  
    const handleClick = useCallback((id) => {
      // Handle click logic
    }, []);
  
    return (
      <div>
        {filteredData.map(item => (
          <Item 
            key={item.id} 
            item={item} 
            onClick={handleClick}
          />
        ))}
      </div>
    );
  }
  
  // Memoize component
  const Item = memo(({ item, onClick }) => {
    return (
      <div onClick={() => onClick(item.id)}>
        {item.name}
      </div>
    );
  });
  \`\`\`
  
  ### 2. Reducing Layout Shifts
  
  **Reserve Space for Dynamic Content:**
  \`\`\`css
  /* Reserve space for images */
  .image-placeholder {
    width: 300px;
    height: 200px;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Use aspect-ratio for responsive images */
  .responsive-image {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
  }
  \`\`\`
  
  ## Network Performance
  
  ### 1. Image Optimization
  
  **Responsive Images:**
  \`\`\`html
  <picture>
    <source media="(min-width: 800px)" srcset="large.webp" type="image/webp">
    <source media="(min-width: 800px)" srcset="large.jpg">
    <source media="(min-width: 400px)" srcset="medium.webp" type="image/webp">
    <source media="(min-width: 400px)" srcset="medium.jpg">
    <img src="small.jpg" alt="Course thumbnail" loading="lazy">
  </picture>
  \`\`\`
  
  ### 2. Caching Strategies
  
  **HTTP Caching Headers:**
  \`\`\`javascript
  // Express.js caching middleware
  app.use('/static', express.static('public', {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true
  }));
  
  app.use('/api', (req, res, next) => {
    // Cache API responses for 5 minutes
    res.set('Cache-Control', 'public, max-age=300');
    next();
  });
  \`\`\`
  
  ## Performance Testing and Monitoring
  
  ### 1. Real User Monitoring
  
  \`\`\`javascript
  // Web Vitals monitoring
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
  
  function sendToAnalytics(metric) {
    // Send to your analytics service
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
  \`\`\`
  
  By implementing these frontend performance optimization techniques, you can significantly improve user experience, search engine rankings, and conversion rates. Remember to measure performance continuously and optimize based on real user data.`,
  
    '3-6': `# Caching Strategies and Implementation
  
  ## Understanding Caching
  
  Caching is the practice of storing frequently accessed data in a faster storage layer to reduce latency and improve performance. Effective caching can dramatically reduce database load, decrease response times, and improve user experience.
  
  ## Cache Levels and Types
  
  ### 1. Browser Caching
  Client-side caching controlled by HTTP headers and browser storage APIs.
  
  ### 2. CDN (Content Delivery Network)
  Geographic distribution of static assets for faster delivery.
  
  ### 3. Application Caching
  In-memory caching within your application server.
  
  ### 4. Database Caching
  Query result caching and database buffer pools.
  
  ## HTTP Caching
  
  ### 1. Cache-Control Headers
  
  \`\`\`javascript
  // Express.js caching middleware
  app.use('/api/courses', (req, res, next) => {
    // Cache for 5 minutes, allow stale responses for 1 hour if server is down
    res.set({
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'Vary': 'Accept-Encoding, Authorization'
    });
    next();
  });
  
  // Static asset caching
  app.use('/static', express.static('public', {
    maxAge: '1y', // Cache for 1 year
    immutable: true, // Content never changes
    etag: false, // Disable ETag for immutable content
  }));
  \`\`\`
  
  ### 2. ETag and Last-Modified Headers
  
  \`\`\`javascript
  // Conditional request handling
  app.get('/api/courses/:id', async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Generate ETag based on course data
    const etag = \`"\${course.id}-\${course.updatedAt.getTime()}"\`;
    
    // Check if client has current version
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    
    res.set({
      'ETag': etag,
      'Last-Modified': course.updatedAt.toUTCString(),
      'Cache-Control': 'private, max-age=300'
    });
    
    res.json(course);
  });
  \`\`\`
  
  ## Application-Level Caching
  
  ### 1. In-Memory Caching with Node.js
  
  \`\`\`javascript
  // Simple in-memory cache
  class MemoryCache {
    constructor() {
      this.cache = new Map();
      this.timers = new Map();
    }
    
    set(key, value, ttl = 300000) { // Default 5 minutes
      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }
      
      // Set value
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl
      });
      
      // Set expiration timer
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      
      this.timers.set(key, timer);
    }
    
    get(key) {
      const item = this.cache.get(key);
      
      if (!item) {
        return null;
      }
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }
      
      return item.value;
    }
  }
  
  // Usage
  const cache = new MemoryCache();
  
  async function getCachedCourses() {
    const cacheKey = 'courses:all';
    let courses = cache.get(cacheKey);
    
    if (!courses) {
      console.log('Cache miss - fetching from database');
      courses = await Course.findAll({
        include: ['lessons', 'instructor']
      });
      cache.set(cacheKey, courses, 600000); // Cache for 10 minutes
    } else {
      console.log('Cache hit');
    }
    
    return courses;
  }
  \`\`\`
  
  ## Redis Caching
  
  ### 1. Redis Setup and Basic Operations
  
  \`\`\`javascript
  const redis = require('redis');
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  });
  
  client.on('error', (err) => {
    console.error('Redis error:', err);
  });
  
  // Cache wrapper function
  async function cacheWrapper(key, fetchFunction, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Cache miss - fetch data
      const data = await fetchFunction();
      
      // Store in cache with TTL
      await client.setex(key, ttl, JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }
  \`\`\`
  
  ## Cache Invalidation Strategies
  
  ### 1. Time-Based Invalidation (TTL)
  
  \`\`\`javascript
  // Set TTL based on data characteristics
  const cacheTTL = {
    userProfile: 1800,      // 30 minutes - changes occasionally
    courseList: 3600,      // 1 hour - changes infrequently  
    popularCourses: 7200,  // 2 hours - changes very rarely
    systemConfig: 86400,   // 24 hours - changes rarely
  };
  
  async function cacheWithTTL(key, data, type = 'default') {
    const ttl = cacheTTL[type] || 3600;
    await redis.setex(key, ttl, JSON.stringify(data));
  }
  \`\`\`
  
  ### 2. Event-Based Invalidation
  
  \`\`\`javascript
  // Event-driven cache invalidation
  const EventEmitter = require('events');
  const cacheInvalidator = new EventEmitter();
  
  // Listen for data changes
  cacheInvalidator.on('course:updated', async (courseId) => {
    await Promise.all([
      redis.del(\`course:\${courseId}\`),
      redis.del(\`courses:category:*\`), // Invalidate category caches
      redis.del('courses:featured'),
      redis.del('courses:popular')
    ]);
  });
  
  // Trigger events on data changes
  Course.afterUpdate((course) => {
    cacheInvalidator.emit('course:updated', course.id);
  });
  \`\`\`
  
  By implementing these caching strategies, you can significantly reduce database load, improve response times, and provide a better user experience. Remember to choose the right caching strategy based on your data access patterns and consistency requirements.`
  };