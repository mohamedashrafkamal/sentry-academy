// Lesson content that would normally come from the database
export const lessonContent: Record<string, string> = {
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

### Database Query Monitoring

\`\`\`javascript
// Monitor database operations
const span = transaction.startChild({
  op: "db.query",
  description: "SELECT * FROM users WHERE active = true"
});

try {
  const users = await db.query("SELECT * FROM users WHERE active = true");
  span.setData("rows_returned", users.length);
  return users;
} finally {
  span.finish();
}
\`\`\`

## Frontend Performance Monitoring

### Core Web Vitals Tracking

\`\`\`javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send metric to your analytics service
  Sentry.addBreadcrumb({
    category: 'performance',
    message: \`\${metric.name}: \${metric.value}\`,
    level: 'info',
    data: metric
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
\`\`\`

### Resource Loading Monitoring

\`\`\`javascript
// Monitor resource loading performance
function trackResourceTiming() {
  const resources = performance.getEntriesByType('resource');
  
  resources.forEach(resource => {
    if (resource.duration > 1000) { // Flag slow resources
      Sentry.addBreadcrumb({
        category: 'performance.resource',
        message: \`Slow resource: \${resource.name}\`,
        level: 'warning',
        data: {
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize
        }
      });
    }
  });
}

// Run after page load
window.addEventListener('load', () => {
  setTimeout(trackResourceTiming, 1000);
});
\`\`\`

## Backend Performance Monitoring

### Express.js Middleware

\`\`\`javascript
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new ProfilingIntegration()],
  profilesSampleRate: 1.0,
  tracesSampleRate: 1.0,
});

// Performance monitoring middleware
app.use((req, res, next) => {
  const transaction = Sentry.startTransaction({
    op: "http.server",
    name: \`\${req.method} \${req.path}\`,
  });

  res.on('finish', () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.finish();
  });

  next();
});
\`\`\`

### Database Performance Monitoring

\`\`\`javascript
// MongoDB monitoring
const mongoose = require('mongoose');

mongoose.set('debug', (collectionName, method, query, doc) => {
  const span = Sentry.getCurrentHub().getScope().getSpan();
  if (span) {
    const childSpan = span.startChild({
      op: 'db.query',
      description: \`\${collectionName}.\${method}\`
    });
    
    childSpan.setData('query', query);
    childSpan.finish();
  }
});
\`\`\`

## Alert Configuration

### Performance Alerts
Set up alerts for critical performance thresholds:

\`\`\`javascript
// Example alert conditions
const performanceAlerts = {
  pageLoadTime: {
    threshold: 3000, // 3 seconds
    condition: 'greater_than'
  },
  errorRate: {
    threshold: 0.05, // 5%
    condition: 'greater_than'
  },
  apdex: {
    threshold: 0.8,
    condition: 'less_than'
  }
};
\`\`\`

### Notification Channels
Configure multiple notification channels:
- Email for critical alerts
- Slack for team notifications
- PagerDuty for on-call escalation
- Webhooks for custom integrations

## Dashboard Creation

### Key Metrics Dashboard
Create dashboards that show:
- Real-time performance metrics
- Historical trends
- Performance budget status
- Error rate correlation
- User satisfaction scores

### Performance Budget Tracking
Implement performance budgets to prevent regressions:

\`\`\`javascript
const performanceBudget = {
  metrics: {
    'first-contentful-paint': 2000,
    'largest-contentful-paint': 2500,
    'cumulative-layout-shift': 0.1
  },
  resourceCounts: {
    'script': 10,
    'image': 20,
    'stylesheet': 5
  },
  resourceSizes: {
    'script': 350000, // 350KB
    'image': 500000,  // 500KB
    'total': 1000000  // 1MB
  }
};
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

Effective profiling is an iterative process that combines tool usage with analytical thinking to systematically improve application performance.`
};