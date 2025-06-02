#!/usr/bin/env bun
import { db, courses, lessons } from "./db/index.ts";
import { eq } from 'drizzle-orm';

// Educational lesson content for Basics of Error Monitoring course
const errorMonitoringLessonContent = {
  lesson1: `# Introduction to Error Monitoring

## What is Error Monitoring?

Error monitoring is the practice of automatically detecting, collecting, and analyzing errors that occur in software applications. Think of it as having a vigilant assistant that never sleeps, constantly watching your application and immediately alerting you when something goes wrong.

Unlike traditional logging, which often requires developers to manually sift through log files to find problems, error monitoring provides structured, actionable insights about application failures in real-time.

## Why Error Monitoring Matters

### The Cost of Undetected Errors

Every unhandled error in production has potential consequences:

- **User Experience**: Broken features frustrate users and can lead to abandonment
- **Business Impact**: Failed transactions directly affect revenue
- **Reputation Damage**: Poor application reliability erodes user trust
- **Development Efficiency**: Time spent firefighting could be used building new features

### The Traditional Problem

Before modern error monitoring, development teams faced several challenges:

1. **Reactive Approach**: Teams only learned about issues when users complained
2. **Incomplete Information**: Error reports from users were often vague or missing context
3. **Difficult Reproduction**: Without proper context, reproducing bugs was time-consuming
4. **Hidden Issues**: Many errors went completely unnoticed, silently degrading user experience

## Core Concepts

### What Gets Monitored

Error monitoring systems track various types of application failures:

**JavaScript Errors**
- Syntax errors in code
- Reference errors (accessing undefined variables)
- Type errors (calling methods on wrong data types)
- Network request failures

**Backend Errors**
- Server crashes and exceptions
- Database connection failures
- API timeouts and rate limiting
- Third-party service integration issues

**Performance Issues**
- Slow database queries
- Memory leaks
- High CPU usage
- Network latency problems

### Error Context and Metadata

Modern error monitoring goes beyond just capturing the error message. It collects valuable context:

**Technical Context**
- Stack trace showing exactly where the error occurred
- Browser version and operating system
- Device type and screen resolution
- Network conditions

**User Context**
- User ID and session information
- Actions leading up to the error
- Current page or feature being used
- User's location and timezone

**Application Context**
- Release version and deployment information
- Feature flags and A/B test variants
- Custom tags and metadata
- Related database records or API calls

## The Error Monitoring Workflow

### Detection
Errors are automatically captured as they occur, without requiring manual intervention. This includes both handled errors (caught by try-catch blocks) and unhandled errors that would otherwise crash the application.

### Aggregation
Similar errors are grouped together to prevent notification spam. Instead of receiving 100 individual alerts for the same bug, you get one notification with a count showing how many users were affected.

### Prioritization
Not all errors are equally important. Error monitoring systems help prioritize issues based on:
- Number of affected users
- Frequency of occurrence
- Business impact of the affected feature
- Severity of the error type

### Notification
Teams receive alerts through their preferred channels (email, Slack, PagerDuty) when new issues are detected or when existing issues cross certain thresholds.

### Resolution
With proper context and stack traces, developers can quickly identify the root cause and deploy fixes. The monitoring system tracks when issues are resolved and can alert if they reoccur.

## Types of Error Monitoring

### Real User Monitoring (RUM)
Captures errors experienced by actual users in production environments. This provides the most accurate picture of user experience but may miss edge cases that only occur under specific conditions.

### Synthetic Monitoring
Uses automated scripts to continuously test application functionality, catching issues before they affect real users. This is particularly useful for monitoring critical user journeys like signup flows or payment processing.

### Performance Monitoring
Tracks application performance metrics alongside errors, helping identify when slow performance might be causing user frustration even without explicit errors.

## Building an Error Monitoring Strategy

### Start with Critical Paths
Begin monitoring the most important user journeys in your application:
- User registration and login
- Payment and checkout processes
- Core feature functionality
- API endpoints with high usage

### Establish Baselines
Before you can identify problems, you need to understand what "normal" looks like:
- Average error rates for different parts of your application
- Typical performance metrics
- Expected user behavior patterns

### Define Success Metrics
Determine how you'll measure the effectiveness of your error monitoring:
- Mean time to detection (MTTD)
- Mean time to resolution (MTTR)
- User-reported issues vs. system-detected issues
- Overall application stability trends

## Common Challenges and Solutions

### Alert Fatigue
**Problem**: Too many notifications can overwhelm teams and cause important alerts to be ignored.

**Solution**: 
- Set appropriate thresholds for notifications
- Use error grouping to reduce noise
- Implement escalation rules for critical issues
- Regularly review and adjust alert sensitivity

### False Positives
**Problem**: Errors that appear serious but don't actually impact users.

**Solution**:
- Add proper error handling for expected failure scenarios
- Use filtering rules to exclude non-actionable errors
- Implement proper error classification
- Monitor user impact metrics alongside error counts

### Context Loss
**Problem**: Errors without sufficient context are difficult to debug and resolve.

**Solution**:
- Capture relevant user and application state
- Include breadcrumbs showing user actions before errors
- Add custom tags and metadata for business context
- Integrate with other observability tools for full picture

## Best Practices for Beginners

### 1. Start Simple
Don't try to monitor everything at once. Begin with basic error detection for your most critical features and gradually expand coverage.

### 2. Focus on User Impact
Prioritize errors that directly affect user experience over internal technical issues that users never see.

### 3. Establish Team Workflows
Create clear processes for:
- Who responds to different types of alerts
- How errors are triaged and prioritized
- When and how stakeholders are notified
- How resolution is tracked and verified

### 4. Learn from Patterns
Regularly review error trends to identify:
- Common sources of bugs in your codebase
- Times when errors spike (deployments, high traffic)
- Features that consistently have issues
- Opportunities for proactive improvements

### 5. Measure and Improve
Track metrics like detection time, resolution time, and user impact to continuously improve your error monitoring effectiveness.

## The Business Value

Error monitoring isn't just a technical tool—it's a business enabler:

**Improved User Experience**: Users encounter fewer broken features and faster issue resolution
**Increased Revenue**: Fewer failed transactions and higher user retention
**Reduced Support Costs**: Proactive issue detection reduces support ticket volume
**Faster Development**: Less time spent debugging means more time building features
**Data-Driven Decisions**: Error patterns inform product and engineering priorities

## Getting Started

The key to successful error monitoring is starting with clear objectives and gradually building more sophisticated monitoring as your needs grow. Focus on monitoring what matters most to your users and business, and let the insights guide your development priorities.

In the next lesson, we'll explore how to set up your first error monitoring system and configure it to capture meaningful, actionable data about your application's health.`,

  lesson2: `# Setting Up Your First Error Monitor

## Planning Your Error Monitoring Setup

Before diving into implementation, it's important to understand your application's architecture and identify the most critical areas to monitor. A well-planned approach will give you maximum value with minimal complexity.

### Understanding Your Application

**Frontend Applications**
These include web browsers, mobile apps, and desktop applications where users directly interact with your software. Frontend errors often manifest as:
- Broken user interface elements
- Failed form submissions
- Navigation issues
- Performance problems affecting user experience

**Backend Services**
Server-side applications, APIs, and microservices that power your frontend. Backend errors typically involve:
- Database connection failures
- API endpoint crashes
- Authentication and authorization issues
- Integration problems with third-party services

**Critical User Journeys**
Identify the paths through your application that are most important to your business:
- User registration and onboarding
- Payment and subscription processes
- Core product features
- Administrative functions

## Choosing an Error Monitoring Solution

### Key Evaluation Criteria

**Ease of Integration**
Look for solutions that can be implemented quickly without major code changes. The best error monitoring tools integrate with just a few lines of code and automatically capture most common error types.

**Language and Framework Support**
Ensure your chosen solution supports your technology stack. Most modern error monitoring platforms support popular languages like JavaScript, Python, Java, PHP, and frameworks like React, Angular, Django, and Rails.

**Alerting and Notification Options**
Consider how your team prefers to receive notifications:
- Email alerts for non-urgent issues
- Slack or Microsoft Teams integration for team coordination
- PagerDuty or Opsgenie for critical production issues
- Mobile app notifications for on-call engineers

**Data Retention and Pricing**
Understand how long error data is stored and how pricing scales with your application's error volume. Start with conservative estimates and plan for growth.

### Popular Error Monitoring Platforms

**Sentry**
Comprehensive error monitoring with strong community support, excellent documentation, and generous free tiers for small projects.

**Rollbar**
Developer-friendly platform with powerful error grouping and detailed stack traces.

**Bugsnag**
Focuses on stability monitoring with business impact metrics and release tracking.

**LogRocket**
Combines error monitoring with session replay for complete user experience visibility.

## Implementation Strategy

### Phase 1: Basic Error Capture

Start with automatic error detection to establish baseline monitoring:

**Unhandled Exceptions**
These are errors that occur unexpectedly and aren't caught by your application's error handling code. They represent the most critical issues because they can crash features or entire applications.

**API Failures**
Monitor external service calls and database queries that might fail due to network issues, service outages, or rate limiting.

**Performance Issues**
Track operations that take unusually long to complete, as these often indicate underlying problems.

### Phase 2: Enhanced Context

Once basic monitoring is working, add contextual information:

**User Information**
Connect errors to specific users (while respecting privacy) to understand impact and patterns.

**Release Tracking**
Tag errors with deployment versions to quickly identify if new releases introduce problems.

**Custom Metadata**
Add business-specific context like feature flags, user segments, or transaction IDs.

### Phase 3: Proactive Monitoring

Expand beyond reactive error detection:

**Custom Error Tracking**
Manually capture business logic errors that don't crash the application but indicate problems.

**Performance Thresholds**
Set alerts for operations that exceed acceptable performance limits.

**Health Checks**
Monitor critical system components even when they're not actively generating errors.

## Configuration Best Practices

### Error Filtering and Grouping

**Noise Reduction**
Configure your monitoring to ignore errors that don't require action:
- Browser extension conflicts
- Network connectivity issues from specific regions
- Known third-party service limitations
- Development and testing errors

**Smart Grouping**
Ensure similar errors are grouped together to prevent alert fatigue:
- Group by error message and stack trace
- Consider user actions that led to the error
- Account for different error contexts (mobile vs. desktop)

### Alert Thresholds

**Start Conservative**
Begin with higher thresholds to avoid overwhelming your team, then gradually lower them as you understand your application's normal error patterns.

**Consider Business Impact**
Set more sensitive alerts for errors affecting critical features like payments or user registration.

**Time-Based Rules**
Configure different alert sensitivities for business hours vs. after-hours, and weekdays vs. weekends.

### Team Workflows

**Ownership Assignment**
Clearly define who is responsible for different types of errors:
- Frontend errors to frontend developers
- API errors to backend teams
- Infrastructure issues to DevOps
- Business logic errors to product teams

**Escalation Procedures**
Establish clear steps for when issues aren't resolved within acceptable timeframes:
- Initial alert to primary oncall
- Escalation to team lead after 30 minutes
- Manager notification for issues lasting over 2 hours
- Executive notification for major outages

## Testing Your Setup

### Verification Steps

**Trigger Test Errors**
Intentionally create errors in a safe environment to verify your monitoring system captures them correctly.

**Check Alert Delivery**
Ensure notifications reach the right people through the correct channels within acceptable timeframes.

**Validate Error Grouping**
Confirm that similar errors are properly grouped and that unique issues create separate alerts.

**Review Context Data**
Verify that captured errors include sufficient information for debugging.

### Common Setup Issues

**Over-Alerting**
If you receive too many notifications, review your filtering rules and alert thresholds. It's better to miss some minor issues than to ignore all alerts due to fatigue.

**Under-Alerting**
If critical issues aren't generating alerts, check your error capture configuration and ensure you're monitoring the right application components.

**Missing Context**
Errors without sufficient debugging information should prompt you to add more contextual data capture.

**False Positives**
Alerts for non-issues indicate a need for better error classification and filtering rules.

## Building Monitoring into Development Workflow

### Development Environment
Set up error monitoring in development environments to catch issues early, but use separate projects or tags to avoid mixing development noise with production alerts.

### Testing and Staging
Use pre-production environments to validate that your error monitoring captures issues correctly before they reach users.

### Deployment Integration
Configure your deployment process to:
- Create new releases in your error monitoring system
- Tag errors with deployment versions
- Monitor error rates after deployments
- Automatically rollback if error rates spike

## Measuring Success

### Key Metrics to Track

**Mean Time to Detection (MTTD)**
How quickly you become aware of issues after they start affecting users.

**Mean Time to Resolution (MTTR)**
How long it takes to fix problems once they're detected.

**Error Rate Trends**
Whether your overall application stability is improving over time.

**User-Reported vs. System-Detected Issues**
The ratio of problems you catch proactively versus those reported by frustrated users.

### Continuous Improvement

**Regular Reviews**
Weekly or monthly review sessions to:
- Analyze error patterns and trends
- Adjust alert thresholds and filters
- Identify opportunities for prevention
- Update team processes and procedures

**Feedback Loops**
Collect input from developers about the usefulness of error information and adjust configuration to provide better debugging context.

**Integration Expansion**
As your team becomes comfortable with basic error monitoring, consider integrating with other tools like performance monitoring, logging systems, and customer support platforms.

## Common Pitfalls to Avoid

**Monitoring Everything at Once**
Start focused and expand gradually rather than trying to monitor every possible error from day one.

**Ignoring Alert Fatigue**
If your team starts ignoring alerts, the entire system becomes useless. Regularly tune your configuration to maintain signal-to-noise ratio.

**Focusing Only on Technical Metrics**
Remember that the goal is improving user experience and business outcomes, not just reducing error counts.

**Neglecting Team Training**
Ensure everyone on your team understands how to interpret error reports and follow established response procedures.

Setting up effective error monitoring is an iterative process. Start with basic coverage of your most critical features, learn from the data you collect, and gradually build more sophisticated monitoring as your needs and understanding grow.

In our next lesson, we'll explore how to analyze error data to identify patterns, prioritize fixes, and prevent future issues.`,

  lesson3: `# Error Context and Debugging Information

## The Power of Context in Error Resolution

When an error occurs in production, the error message itself is often just the tip of the iceberg. What happened before the error? What was the user trying to accomplish? What was the state of the application? These contextual details make the difference between spending hours hunting for bugs and quickly identifying and fixing issues.

## Understanding Error Context

### Technical Context

**Stack Traces**
The sequence of function calls that led to an error. Think of it as a breadcrumb trail showing exactly how your application arrived at the problematic code. A good stack trace shows:
- The specific line of code where the error occurred
- The function calls that led to that point
- The files and modules involved in the execution path

**Environment Information**
Details about the runtime environment help identify if errors are specific to certain conditions:
- Operating system and version
- Browser type and version
- Device type (mobile, tablet, desktop)
- Screen resolution and available memory
- Network connection quality

**Application State**
The condition of your application when the error occurred:
- Current page or feature being used
- Form data or user inputs
- Authentication status
- Active feature flags or configuration settings

### User Context

**User Journey**
Understanding what the user was trying to accomplish provides crucial insight into error impact and urgency:
- Navigation path leading to the error
- Previous actions taken in the session
- Time spent on different pages
- Attempted interactions before the failure

**User Characteristics**
Demographic and behavioral information helps identify patterns:
- User type (new vs. returning)
- Geographic location
- Language and locale settings
- Subscription or account level
- Previous support interactions

**Session Information**
Details about the user's current session:
- Session duration
- Number of page views
- Other errors in the same session
- Performance metrics for the session

### Business Context

**Feature Impact**
Understanding which business features are affected helps prioritize fixes:
- Revenue-generating features (payments, subscriptions)
- Core product functionality
- User onboarding and engagement features
- Administrative and support tools

**Customer Impact**
Assessing the business consequences of errors:
- Number of affected users
- Potential revenue loss
- Support ticket generation
- Customer satisfaction implications

## Types of Debugging Information

### Breadcrumbs

Breadcrumbs are a chronological trail of events leading up to an error. They provide crucial context about user behavior and application flow:

**User Actions**
- Button clicks and form submissions
- Page navigation and routing changes
- Search queries and filter applications
- File uploads or downloads

**System Events**
- API calls and database queries
- Authentication attempts
- Cache hits and misses
- Background job executions

**Performance Markers**
- Page load times
- Network request durations
- Database query performance
- Memory usage changes

### Custom Tags and Metadata

**Business Logic Tags**
- Feature flags and experiment variants
- User segments and cohorts
- Product categories or types
- Workflow stages or process steps

**Technical Tags**
- Service versions and build numbers
- Database cluster or region
- CDN or server locations
- Third-party service versions

### Release and Deployment Context

**Version Tracking**
Connecting errors to specific code releases helps identify when problems were introduced:
- Application version numbers
- Git commit hashes
- Deployment timestamps
- Feature rollout percentages

**Environment Information**
Understanding deployment context:
- Production vs. staging environments
- Server regions and availability zones
- Infrastructure versions (Node.js, Python, etc.)
- Database schema versions

## Effective Error Grouping

### Smart Aggregation

**Similarity Detection**
Modern error monitoring systems group similar errors to prevent alert fatigue:
- Stack trace fingerprinting
- Error message pattern matching
- User action sequence analysis
- Environment characteristic clustering

**Impact Assessment**
Grouping helps understand the scope of issues:
- Total number of affected users
- Geographic distribution of errors
- Time patterns and trends
- Device and browser distribution

### Custom Grouping Rules

**Business Logic Grouping**
Sometimes technical similarity doesn't match business impact:
- Group by affected feature or workflow
- Separate errors by user type or subscription level
- Distinguish between error severity levels
- Account for different error contexts

## Prioritization Strategies

### Severity Assessment

**User Impact Severity**
- **Critical**: Prevents core functionality, affects payments
- **High**: Degrades important features, affects many users
- **Medium**: Minor feature issues, affects some users
- **Low**: Cosmetic issues, affects few users

**Business Impact Priority**
- Revenue-affecting errors get highest priority
- User experience issues prioritized by affected user count
- New feature errors evaluated against rollout goals
- Legacy feature errors assessed against maintenance costs

### Resource Allocation

**Team Expertise Matching**
Route errors to teams with relevant expertise:
- Frontend errors to UI/UX teams
- API errors to backend developers
- Performance issues to infrastructure teams
- Business logic errors to product teams

**Workload Balancing**
Consider current team capacity and competing priorities:
- Critical production issues always take precedence
- Schedule non-urgent fixes during regular sprint planning
- Balance bug fixes with new feature development
- Account for team member availability and expertise

## Building Effective Debugging Workflows

### Initial Triage

**Rapid Assessment**
Quick evaluation to determine immediate action needed:
- Is this affecting active users right now?
- Is this a new issue or recurring problem?
- Do we have enough information to investigate?
- Who is the right person to investigate?

**Information Gathering**
Collect additional context if needed:
- Check related system metrics
- Review recent deployments or changes
- Examine user feedback and support tickets
- Verify error frequency and trends

### Investigation Process

**Hypothesis Formation**
Use available context to form theories about root causes:
- Recent code changes that might be related
- Known issues with similar symptoms
- Environmental factors that could contribute
- User behavior patterns that might trigger the error

**Reproduction Attempts**
Try to recreate the error in controlled environments:
- Use the same browser and device type
- Follow the user's navigation path
- Input similar data or interactions
- Test under similar network conditions

### Resolution Documentation

**Root Cause Analysis**
Document findings for future reference:
- What caused the error?
- Why wasn't it caught earlier?
- What conditions must exist for it to occur?
- How can similar issues be prevented?

**Fix Validation**
Confirm that solutions actually resolve the problem:
- Test fixes in staging environments
- Monitor error rates after deployment
- Verify user experience improvements
- Check for any unintended side effects

## Learning from Error Patterns

### Trend Analysis

**Temporal Patterns**
Look for time-based trends in error occurrence:
- Errors that spike during high-traffic periods
- Issues that appear after deployments
- Problems that correlate with external events
- Seasonal or cyclical error patterns

**Code Quality Insights**
Use error patterns to improve development practices:
- Files or modules with frequent errors
- Types of coding mistakes that recur
- Testing gaps that allow bugs to reach production
- Architecture patterns that are error-prone

### Prevention Strategies

**Proactive Monitoring**
Use error context to set up better monitoring:
- Add health checks for commonly failing components
- Monitor leading indicators that predict errors
- Set up alerts for unusual user behavior patterns
- Track performance metrics that correlate with errors

**Development Process Improvements**
Apply lessons learned to prevent future issues:
- Add automated tests for common error scenarios
- Improve code review processes to catch error-prone patterns
- Enhance staging environments to better match production
- Update deployment practices to reduce error-inducing changes

## Best Practices for Maximizing Context Value

### Balance Detail with Performance
Collect comprehensive context without significantly impacting application performance. Focus on high-value information that aids debugging while minimizing data collection overhead.

### Respect User Privacy
Ensure that contextual information collection complies with privacy regulations and user expectations. Avoid capturing sensitive personal information and provide clear opt-out mechanisms.

### Regularly Review and Refine
Continuously evaluate the usefulness of collected context. Remove data that isn't helping with debugging and add new context that would improve investigation efficiency.

### Train Your Team
Ensure all team members understand how to interpret and utilize error context effectively. Regular training on debugging techniques and context analysis improves overall team efficiency.

## Measuring Context Effectiveness

Track metrics that indicate whether your error context is helping achieve faster resolution:
- Time from error detection to root cause identification
- Percentage of errors resolved without additional investigation
- Reduction in back-and-forth communication during debugging
- Developer satisfaction with available debugging information

Effective error context transforms reactive firefighting into proactive problem-solving. By capturing the right information at the right time, your team can quickly understand not just what went wrong, but why it went wrong and how to prevent similar issues in the future.

The goal isn't to capture every possible piece of information, but to thoughtfully collect the context that enables fast, accurate debugging and drives continuous improvement in application reliability.`
};

async function populateErrorMonitoringContent() {
  try {
    console.log('🐛 Populating Error Monitoring course content...');
    
    // Find the Error Monitoring course
    const errorMonitoringCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.title, 'Basics of Error Monitoring'))
      .limit(1);
    
    if (errorMonitoringCourse.length === 0) {
      console.error('❌ Error Monitoring course not found');
      return;
    }
    
    const courseId = errorMonitoringCourse[0].id;
    console.log(`Found course: ${errorMonitoringCourse[0].title} (ID: ${courseId})`);
    
    // Get existing lessons
    const existingLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    
    console.log(`Found ${existingLessons.length} existing lessons`);
    
    // Update lessons with rich content
    const lessonUpdates = [
      {
        title: 'Introduction to Error Monitoring',
        content: errorMonitoringLessonContent.lesson1
      },
      {
        title: 'Setting Up Your First Error Monitor', 
        content: errorMonitoringLessonContent.lesson2
      },
      {
        title: 'Error Context and Debugging Information',
        content: errorMonitoringLessonContent.lesson3
      }
    ];
    
    for (let i = 0; i < Math.min(lessonUpdates.length, existingLessons.length); i++) {
      const lesson = existingLessons[i];
      const update = lessonUpdates[i];
      
      await db
        .update(lessons)
        .set({
          content: update.content,
          updatedAt: new Date()
        })
        .where(eq(lessons.id, lesson.id));
      
      console.log(`✅ Updated lesson: ${lesson.title}`);
    }
    
    console.log('🎉 Successfully populated Error Monitoring course content!');
    
    // Verify the updates
    const updatedLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        contentLength: lessons.content
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    
    console.log('\n📚 Updated lessons summary:');
    updatedLessons.forEach(lesson => {
      const contentLength = lesson.contentLength ? lesson.contentLength.length : 0;
      console.log(`  - ${lesson.title}: ${contentLength} characters`);
    });
    
  } catch (error) {
    console.error('❌ Error populating Error Monitoring course content:', error);
  }
  
  process.exit(0);
}

populateErrorMonitoringContent();