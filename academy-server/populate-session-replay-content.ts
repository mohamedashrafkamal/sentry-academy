#!/usr/bin/env bun
import { db, courses, lessons } from "./db/index.ts";
import { eq } from 'drizzle-orm';

// Comprehensive lesson content for Session Replay course
const sessionReplayLessonContent = {
  lesson1: `# What is Session Replay?

## Introduction to Session Replay Technology

Session Replay is a powerful observability tool that records and recreates user interactions with web applications. Unlike traditional analytics that only provide statistical data, session replay captures the actual user experience, allowing developers to see exactly what users see and do on their websites.

## How Session Replay Works

### Core Recording Mechanism
Session replay works by capturing DOM mutations, user interactions, and browser events in real-time, then reconstructing them for later playback.

\`\`\`javascript
// Basic session replay initialization with Sentry
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.Replay({
      // Capture 10% of normal sessions
      sessionSampleRate: 0.1,
      // Capture 100% of sessions with errors
      errorSampleRate: 1.0,
      // Mask sensitive data
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
});
\`\`\`

### What Gets Recorded
- **DOM Structure**: Initial page structure and all subsequent changes
- **User Interactions**: Clicks, scrolls, form inputs, hovers
- **Network Activity**: API calls, resource loading, errors
- **Console Logs**: JavaScript errors and custom log messages
- **Page Navigation**: Route changes and page transitions

### Privacy-First Recording
\`\`\`javascript
// Advanced privacy configuration
const replayIntegration = new Sentry.Replay({
  // Mask sensitive form inputs
  maskAllInputs: true,
  
  // Block specific elements
  block: ['.sensitive-data', '#credit-card-form'],
  
  // Mask text content
  mask: ['.user-name', '.email-address'],
  
  // Custom privacy rules
  beforeAddRecordingEvent: (event) => {
    // Custom logic to filter sensitive events
    if (event.type === 'input' && event.target?.name === 'password') {
      return null; // Don't record password inputs
    }
    return event;
  }
});
\`\`\`

## Benefits of Session Replay

### 1. Enhanced Debugging Capabilities
Session replay transforms debugging from guesswork into precise problem identification:

\`\`\`javascript
// Example: Debugging with replay context
function handlePaymentError(error) {
  Sentry.captureException(error, {
    tags: {
      section: 'payment',
      user_action: 'checkout'
    },
    extra: {
      payment_method: 'credit_card',
      cart_value: 150.00
    }
  });
  
  // The associated replay will show exactly what the user
  // was doing when this error occurred
}
\`\`\`

### 2. User Experience Optimization
- **Identify UX Pain Points**: See where users struggle or get confused
- **Conversion Funnel Analysis**: Watch actual user behavior through conversion flows
- **Performance Issues**: Spot slow-loading elements affecting user experience

### 3. Quality Assurance
- **Bug Reproduction**: Reproduce issues exactly as users experienced them
- **Edge Case Discovery**: Find unexpected user behaviors and edge cases
- **Feature Validation**: Verify that new features work as intended in real usage

## Types of Session Replay

### Full Session Recording
Records complete user sessions from start to finish:

\`\`\`javascript
// Configuration for full session recording
const fullSessionReplay = new Sentry.Replay({
  sessionSampleRate: 0.1, // Record 10% of all sessions
  maxReplayDuration: 60 * 60 * 1000, // 1 hour max
  minReplayDuration: 5 * 1000, // 5 seconds minimum
});
\`\`\`

### Error-Triggered Recording
Only records sessions when errors occur:

\`\`\`javascript
// Error-only recording for better performance
const errorOnlyReplay = new Sentry.Replay({
  sessionSampleRate: 0, // Don't record normal sessions
  errorSampleRate: 1.0, // Record 100% of error sessions
  onErrorSampleRate: 1.0 // Also record when errors occur
});
\`\`\`

### Conditional Recording
Record based on specific conditions:

\`\`\`javascript
// Custom conditional recording
const conditionalReplay = new Sentry.Replay({
  sessionSampleRate: 0,
  shouldCreateReplaySession: () => {
    // Only record for premium users
    return user.isPremium && Math.random() < 0.5;
  }
});
\`\`\`

## Session Replay Architecture

### Client-Side Components
1. **Event Capture**: Records DOM mutations and user interactions
2. **Data Compression**: Reduces payload size for efficient transmission
3. **Privacy Filtering**: Applies masking and blocking rules
4. **Buffering**: Manages memory usage and network transmission

### Server-Side Processing
1. **Event Storage**: Stores compressed replay data
2. **Indexing**: Creates searchable metadata
3. **Replay Generation**: Reconstructs sessions for playback
4. **Analytics**: Generates insights from replay data

## Implementation Considerations

### Performance Impact
Session replay is designed to have minimal performance impact:

\`\`\`javascript
// Performance monitoring during replay
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 100) { // Log slow operations
      console.warn('Slow operation detected:', entry.name, entry.duration);
    }
  }
});

performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });

// Replay with performance monitoring
const performantReplay = new Sentry.Replay({
  sessionSampleRate: 0.1,
  // Use compression to reduce bandwidth
  useCompression: true,
  // Limit network usage
  networkDetailAllowed: false,
  // Optimize for performance
  collectFonts: false
});
\`\`\`

### Storage and Bandwidth
- **Compression**: Modern replay tools use advanced compression algorithms
- **Selective Recording**: Record only important interactions
- **Sampling**: Use appropriate sampling rates to balance insights with costs

### Browser Compatibility
\`\`\`javascript
// Check browser support before initializing
function initializeReplay() {
  if (!window.MutationObserver || !window.JSON) {
    console.warn('Session replay not supported in this browser');
    return;
  }
  
  const replay = new Sentry.Replay({
    sessionSampleRate: 0.1,
    errorSampleRate: 1.0
  });
  
  return replay;
}
\`\`\`

## Common Use Cases

### 1. Customer Support
\`\`\`javascript
// Link replay to support tickets
function createSupportTicket(issueDescription) {
  const replayId = Sentry.getCurrentHub().getScope()?.getReplay()?.getReplayId();
  
  return submitTicket({
    description: issueDescription,
    replayId: replayId,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  });
}
\`\`\`

### 2. Product Analytics
\`\`\`javascript
// Track feature usage with replay context
function trackFeatureUsage(featureName, success) {
  Sentry.addBreadcrumb({
    message: \`Feature used: \${featureName}\`,
    category: 'user-action',
    data: {
      feature: featureName,
      success: success,
      timestamp: Date.now()
    }
  });
  
  if (!success) {
    Sentry.captureMessage(\`Feature failure: \${featureName}\`, 'warning');
  }
}
\`\`\`

### 3. A/B Testing
\`\`\`javascript
// Replay-enhanced A/B testing
function initializeABTest() {
  const variant = getABTestVariant();
  
  Sentry.setTag('ab_test_variant', variant);
  
  // Apply variant-specific changes
  if (variant === 'new_checkout') {
    enableNewCheckoutFlow();
  }
  
  // Track conversion with replay context
  trackConversion('checkout_completed', {
    variant: variant,
    replayId: Sentry.getCurrentHub().getScope()?.getReplay()?.getReplayId()
  });
}
\`\`\`

## Privacy and Compliance

### GDPR Compliance
\`\`\`javascript
// GDPR-compliant replay setup
const gdprCompliantReplay = new Sentry.Replay({
  // Only record with explicit consent
  sessionSampleRate: userHasConsented() ? 0.1 : 0,
  
  // Mask all personal data
  maskAllText: true,
  maskAllInputs: true,
  
  // Block sensitive areas
  block: [
    '.gdpr-sensitive',
    '[data-sensitive]',
    '.personal-info'
  ],
  
  // Custom privacy handler
  beforeAddRecordingEvent: (event) => {
    // Additional privacy checks
    if (containsPersonalData(event)) {
      return maskPersonalData(event);
    }
    return event;
  }
});
\`\`\`

### Data Retention
\`\`\`javascript
// Configure data retention policies
const replayWithRetention = new Sentry.Replay({
  sessionSampleRate: 0.1,
  
  // Custom metadata for retention
  beforeSend: (event) => {
    event.extra = {
      ...event.extra,
      retention_policy: 'standard_30_days',
      data_classification: 'internal',
      created_at: new Date().toISOString()
    };
    return event;
  }
});
\`\`\`

## Integration with Development Workflow

### CI/CD Integration
\`\`\`javascript
// Environment-specific replay configuration
const getReplayConfig = () => {
  const environment = process.env.NODE_ENV;
  
  if (environment === 'production') {
    return {
      sessionSampleRate: 0.05,
      errorSampleRate: 1.0,
      maskAllText: true
    };
  } else if (environment === 'staging') {
    return {
      sessionSampleRate: 0.2,
      errorSampleRate: 1.0,
      maskAllText: false
    };
  } else {
    return {
      sessionSampleRate: 1.0, // Record all in development
      errorSampleRate: 1.0,
      maskAllText: false
    };
  }
};

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Replay(getReplayConfig())
  ]
});
\`\`\`

### Testing with Replay
\`\`\`javascript
// E2E testing with replay validation
describe('Checkout Flow', () => {
  beforeEach(() => {
    // Enable replay for test sessions
    cy.window().then((win) => {
      win.Sentry?.init({
        dsn: 'test-dsn',
        integrations: [
          new win.Sentry.Replay({
            sessionSampleRate: 1.0
          })
        ]
      });
    });
  });
  
  it('should complete purchase successfully', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="purchase-button"]').click();
    
    // Verify replay captured the interaction
    cy.window().then((win) => {
      const replayId = win.Sentry?.getCurrentHub()
        ?.getScope()?.getReplay()?.getReplayId();
      expect(replayId).to.exist;
    });
  });
});
\`\`\`

## Best Practices

### 1. Sampling Strategy
- Start with low sampling rates (1-5%) and adjust based on value
- Use higher rates for critical user journeys
- Implement dynamic sampling based on user segments

### 2. Privacy by Design
- Default to maximum privacy settings
- Implement granular privacy controls
- Regular privacy audits and compliance checks

### 3. Performance Optimization
- Monitor replay overhead in production
- Use compression and efficient sampling
- Implement circuit breakers for high-traffic scenarios

### 4. Team Training
- Train developers on replay analysis techniques
- Establish workflows for replay-driven debugging
- Create playbooks for common replay scenarios

Session replay is a transformative technology that bridges the gap between user experience and technical implementation, providing unprecedented visibility into how users actually interact with your applications.`,

  lesson2: `# Setting Up Session Replay

## Planning Your Session Replay Implementation

Before implementing session replay, it's crucial to establish a comprehensive strategy that addresses technical requirements, privacy considerations, and business objectives.

### Implementation Strategy

#### 1. Define Recording Objectives
\`\`\`javascript
// Example configuration based on different objectives
const REPLAY_OBJECTIVES = {
  DEBUGGING: {
    sessionSampleRate: 0.05,
    errorSampleRate: 1.0,
    minReplayDuration: 10000, // 10 seconds
    networkDetailAllowed: true
  },
  
  UX_RESEARCH: {
    sessionSampleRate: 0.2,
    errorSampleRate: 1.0,
    recordCanvas: true,
    collectFonts: true
  },
  
  CUSTOMER_SUPPORT: {
    sessionSampleRate: 0.1,
    errorSampleRate: 1.0,
    maskAllInputs: false, // With user consent
    maxReplayDuration: 3600000 // 1 hour
  }
};

function getReplayConfig(objective) {
  return REPLAY_OBJECTIVES[objective] || REPLAY_OBJECTIVES.DEBUGGING;
}
\`\`\`

#### 2. Privacy Assessment
\`\`\`javascript
// Privacy configuration matrix
const PRIVACY_LEVELS = {
  STRICT: {
    maskAllText: true,
    maskAllInputs: true,
    blockAllMedia: true,
    block: ['.sensitive', '[data-private]', '.pii'],
    beforeAddRecordingEvent: (event) => {
      // Aggressive filtering
      if (event.type === 'input' || event.type === 'change') {
        return null;
      }
      return event;
    }
  },
  
  MODERATE: {
    maskAllText: false,
    maskAllInputs: true,
    blockAllMedia: false,
    mask: ['.user-data', '.financial-info'],
    block: ['.credit-card', '.ssn']
  },
  
  MINIMAL: {
    maskAllText: false,
    maskAllInputs: false,
    blockAllMedia: false,
    mask: ['.password', '.credit-card-number']
  }
};
\`\`\`

## Technical Implementation

### Core Setup with Sentry

#### Basic Integration
\`\`\`javascript
import * as Sentry from "@sentry/browser";

// Environment-aware configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  integrations: [
    new Sentry.Replay({
      // Sampling rates based on environment
      sessionSampleRate: isDevelopment ? 1.0 : 0.1,
      errorSampleRate: 1.0,
      
      // Privacy settings
      maskAllText: isProduction,
      maskAllInputs: isProduction,
      
      // Performance settings
      useCompression: true,
      networkDetailAllowed: !isProduction,
      
      // Custom configuration
      beforeAddRecordingEvent: (event, hint) => {
        return filterSensitiveEvents(event, hint);
      }
    })
  ],
  
  // Other Sentry configuration
  tracesSampleRate: isDevelopment ? 1.0 : 0.1,
  debug: isDevelopment
});

function filterSensitiveEvents(event, hint) {
  // Custom filtering logic
  if (event.type === 'input' && event.target?.type === 'password') {
    return null; // Don't record password inputs
  }
  
  if (event.type === 'click' && event.target?.dataset?.sensitive) {
    return null; // Don't record clicks on sensitive elements
  }
  
  return event;
}
\`\`\`

#### Advanced Configuration
\`\`\`javascript
// Advanced replay setup with custom options
class SessionReplayManager {
  constructor(config = {}) {
    this.config = {
      maxReplayDuration: 60 * 60 * 1000, // 1 hour
      minReplayDuration: 5 * 1000, // 5 seconds
      maxReplaySize: 50 * 1024 * 1024, // 50MB
      ...config
    };
    
    this.replayInstance = null;
    this.isRecording = false;
  }
  
  async initialize() {
    try {
      // Check browser compatibility
      if (!this.isBrowserSupported()) {
        console.warn('Session replay not supported in this browser');
        return false;
      }
      
      // Initialize Sentry with replay
      Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN,
        integrations: [
          new Sentry.Replay({
            sessionSampleRate: this.config.sessionSampleRate,
            errorSampleRate: this.config.errorSampleRate,
            maxReplayDuration: this.config.maxReplayDuration,
            minReplayDuration: this.config.minReplayDuration,
            
            // Custom event filtering
            beforeAddRecordingEvent: this.filterEvents.bind(this),
            
            // Privacy controls
            ...this.getPrivacyConfig(),
            
            // Performance optimizations
            ...this.getPerformanceConfig()
          })
        ]
      });
      
      this.isRecording = true;
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize session replay:', error);
      return false;
    }
  }
  
  isBrowserSupported() {
    return !!(
      window.MutationObserver &&
      window.JSON &&
      window.localStorage &&
      'addEventListener' in window
    );
  }
  
  getPrivacyConfig() {
    const userConsent = this.getUserConsent();
    
    if (!userConsent.functional) {
      return { sessionSampleRate: 0 }; // No recording without consent
    }
    
    return {
      maskAllText: !userConsent.analytics,
      maskAllInputs: true,
      blockAllMedia: !userConsent.analytics,
      mask: [
        '.sensitive-data',
        '[data-private]',
        '.user-email',
        '.phone-number'
      ],
      block: [
        '.credit-card-form',
        '.password-field',
        '.ssn-input',
        '.security-question'
      ]
    };
  }
  
  getPerformanceConfig() {
    return {
      useCompression: true,
      collectFonts: false, // Reduce payload size
      recordCanvas: false, // Disable canvas recording for performance
      networkDetailAllowed: false, // Reduce data collection
      
      // Custom sampling based on device performance
      sessionSampleRate: this.getAdaptiveSampleRate()
    };
  }
  
  getAdaptiveSampleRate() {
    try {
      // Adjust sampling based on device capabilities
      const memory = navigator.deviceMemory || 4; // GB
      const cores = navigator.hardwareConcurrency || 4;
      const connection = navigator.connection?.effectiveType || '4g';
      
      let sampleRate = 0.1; // Default 10%
      
      // Reduce sampling on low-end devices
      if (memory < 4 || cores < 4) {
        sampleRate *= 0.5;
      }
      
      // Reduce sampling on slow connections
      if (connection === 'slow-2g' || connection === '2g') {
        sampleRate *= 0.3;
      } else if (connection === '3g') {
        sampleRate *= 0.7;
      }
      
      return Math.max(sampleRate, 0.01); // Minimum 1%
    } catch (error) {
      return 0.1; // Default fallback
    }
  }
  
  filterEvents(event, hint) {
    // Performance filtering
    if (this.shouldSkipEvent(event)) {
      return null;
    }
    
    // Privacy filtering
    if (this.containsSensitiveData(event)) {
      return this.sanitizeEvent(event);
    }
    
    // Size limiting
    if (this.isEventTooLarge(event)) {
      return this.truncateEvent(event);
    }
    
    return event;
  }
  
  shouldSkipEvent(event) {
    // Skip high-frequency, low-value events
    if (event.type === 'mousemove' && Math.random() > 0.1) {
      return true; // Only record 10% of mouse moves
    }
    
    if (event.type === 'scroll' && Math.random() > 0.3) {
      return true; // Only record 30% of scroll events
    }
    
    return false;
  }
  
  containsSensitiveData(event) {
    if (event.target) {
      const element = event.target;
      return (
        element.type === 'password' ||
        element.autocomplete?.includes('cc-') ||
        element.name?.includes('ssn') ||
        element.className?.includes('sensitive')
      );
    }
    return false;
  }
  
  sanitizeEvent(event) {
    // Create sanitized copy
    const sanitized = { ...event };
    
    if (sanitized.value) {
      sanitized.value = '*'.repeat(sanitized.value.length);
    }
    
    if (sanitized.data && typeof sanitized.data === 'string') {
      sanitized.data = sanitized.data.replace(/\d{4,}/g, '****');
    }
    
    return sanitized;
  }
  
  isEventTooLarge(event) {
    const eventSize = JSON.stringify(event).length;
    return eventSize > 10000; // 10KB limit per event
  }
  
  truncateEvent(event) {
    const truncated = { ...event };
    
    if (truncated.data && truncated.data.length > 1000) {
      truncated.data = truncated.data.substring(0, 1000) + '...';
    }
    
    return truncated;
  }
  
  setupEventListeners() {
    // Monitor replay health
    this.monitorReplayHealth();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseRecording();
      } else {
        this.resumeRecording();
      }
    });
    
    // Handle low memory conditions
    if ('memory' in performance) {
      setInterval(() => {
        if (performance.memory.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
          this.optimizeForMemory();
        }
      }, 30000);
    }
  }
  
  monitorReplayHealth() {
    setInterval(() => {
      const replayData = this.getReplayMetrics();
      
      if (replayData.eventsPerSecond > 100) {
        console.warn('High replay event rate detected:', replayData.eventsPerSecond);
        this.throttleRecording();
      }
      
      if (replayData.memoryUsage > 50 * 1024 * 1024) { // 50MB
        console.warn('High replay memory usage:', replayData.memoryUsage);
        this.optimizeForMemory();
      }
    }, 10000); // Check every 10 seconds
  }
  
  getUserConsent() {
    // Implement your consent management
    return {
      functional: localStorage.getItem('consent_functional') === 'true',
      analytics: localStorage.getItem('consent_analytics') === 'true'
    };
  }
  
  pauseRecording() {
    // Implement pause logic
    console.log('Pausing session replay recording');
  }
  
  resumeRecording() {
    // Implement resume logic
    console.log('Resuming session replay recording');
  }
  
  throttleRecording() {
    // Implement throttling logic
    console.log('Throttling session replay recording');
  }
  
  optimizeForMemory() {
    // Implement memory optimization
    console.log('Optimizing session replay for memory usage');
  }
  
  getReplayMetrics() {
    // Return current replay metrics
    return {
      eventsPerSecond: 10,
      memoryUsage: 1024 * 1024, // 1MB
      recordingDuration: 60000 // 1 minute
    };
  }
}

// Usage
const replayManager = new SessionReplayManager({
  sessionSampleRate: 0.1,
  errorSampleRate: 1.0
});

replayManager.initialize();
\`\`\`

### Framework-Specific Integration

#### React Integration
\`\`\`javascript
// React hook for session replay
import { useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';

export function useSessionReplay(options = {}) {
  const {
    enabled = true,
    trackErrors = true,
    trackUserActions = true,
    privacyMode = 'moderate'
  } = options;
  
  const startReplay = useCallback((sessionId) => {
    if (!enabled) return;
    
    Sentry.addBreadcrumb({
      message: 'Session replay started',
      category: 'replay',
      data: { sessionId }
    });
  }, [enabled]);
  
  const stopReplay = useCallback(() => {
    if (!enabled) return;
    
    Sentry.addBreadcrumb({
      message: 'Session replay stopped',
      category: 'replay'
    });
  }, [enabled]);
  
  const captureUserAction = useCallback((action, data = {}) => {
    if (!trackUserActions) return;
    
    Sentry.addBreadcrumb({
      message: \`User action: \${action}\`,
      category: 'user',
      data
    });
  }, [trackUserActions]);
  
  useEffect(() => {
    // Initialize replay on component mount
    if (enabled) {
      startReplay(\`session_\${Date.now()}\`);
    }
    
    return () => {
      // Cleanup on unmount
      stopReplay();
    };
  }, [enabled, startReplay, stopReplay]);
  
  return {
    startReplay,
    stopReplay,
    captureUserAction
  };
}

// Usage in React components
function App() {
  const { captureUserAction } = useSessionReplay({
    enabled: process.env.NODE_ENV === 'production',
    privacyMode: 'strict'
  });
  
  const handleButtonClick = () => {
    captureUserAction('button_click', {
      button: 'primary_cta',
      page: 'homepage'
    });
  };
  
  return (
    <div>
      <button onClick={handleButtonClick}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

#### Vue.js Integration
\`\`\`javascript
// Vue plugin for session replay
import * as Sentry from '@sentry/browser';

export default {
  install(app, options = {}) {
    const replayConfig = {
      sessionSampleRate: options.sessionSampleRate || 0.1,
      errorSampleRate: options.errorSampleRate || 1.0,
      ...options
    };
    
    // Initialize Sentry with replay
    Sentry.init({
      dsn: options.dsn,
      integrations: [
        new Sentry.Replay(replayConfig)
      ]
    });
    
    // Add global properties
    app.config.globalProperties.$replay = {
      captureUserAction: (action, data) => {
        Sentry.addBreadcrumb({
          message: \`User action: \${action}\`,
          category: 'user',
          data
        });
      },
      
      capturePageView: (route) => {
        Sentry.addBreadcrumb({
          message: \`Page view: \${route.path}\`,
          category: 'navigation',
          data: { route: route.name, params: route.params }
        });
      }
    };
    
    // Global error handler
    app.config.errorHandler = (error, instance, info) => {
      Sentry.captureException(error, {
        contexts: {
          vue: {
            componentName: instance?.$options.name,
            errorInfo: info
          }
        }
      });
    };
  }
};

// Usage in Vue app
import { createApp } from 'vue';
import SessionReplayPlugin from './plugins/session-replay';

const app = createApp(App);

app.use(SessionReplayPlugin, {
  dsn: process.env.VUE_APP_SENTRY_DSN,
  sessionSampleRate: 0.1
});
\`\`\`

### Testing Session Replay

#### Unit Testing
\`\`\`javascript
// Mock session replay for testing
jest.mock('@sentry/browser', () => ({
  init: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  Replay: jest.fn().mockImplementation((config) => ({
    config,
    start: jest.fn(),
    stop: jest.fn()
  }))
}));

describe('SessionReplayManager', () => {
  let replayManager;
  
  beforeEach(() => {
    replayManager = new SessionReplayManager();
  });
  
  it('should initialize with correct configuration', async () => {
    const result = await replayManager.initialize();
    
    expect(result).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.arrayContaining([
          expect.objectContaining({
            config: expect.objectContaining({
              sessionSampleRate: expect.any(Number)
            })
          })
        ])
      })
    );
  });
  
  it('should filter sensitive events', () => {
    const sensitiveEvent = {
      type: 'input',
      target: { type: 'password' },
      value: 'secret123'
    };
    
    const filtered = replayManager.filterEvents(sensitiveEvent);
    expect(filtered).toBeNull();
  });
});
\`\`\`

#### E2E Testing with Replay Validation
\`\`\`javascript
// Cypress test with replay validation
describe('Checkout Flow with Replay', () => {
  beforeEach(() => {
    // Setup replay for testing
    cy.window().then((win) => {
      win.testReplayEvents = [];
      
      // Mock Sentry replay
      win.Sentry = {
        init: cy.stub(),
        addBreadcrumb: cy.stub().callsFake((breadcrumb) => {
          win.testReplayEvents.push(breadcrumb);
        }),
        captureException: cy.stub()
      };
    });
  });
  
  it('should record user interactions during checkout', () => {
    cy.visit('/checkout');
    
    // Perform checkout actions
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="continue-button"]').click();
    cy.get('[data-testid="payment-form"]').should('be.visible');
    
    // Verify replay events were captured
    cy.window().then((win) => {
      expect(win.testReplayEvents).to.have.length.greaterThan(0);
      
      const userActions = win.testReplayEvents.filter(
        event => event.category === 'user'
      );
      expect(userActions).to.have.length.greaterThan(2);
    });
  });
  
  it('should respect privacy settings', () => {
    cy.visit('/checkout');
    
    // Type in password field
    cy.get('[data-testid="password-input"]').type('secretpassword');
    
    // Verify password input was not recorded
    cy.window().then((win) => {
      const inputEvents = win.testReplayEvents.filter(
        event => event.message?.includes('input') && 
               event.data?.elementType === 'password'
      );
      expect(inputEvents).to.have.length(0);
    });
  });
});
\`\`\`

### Production Deployment

#### Environment Configuration
\`\`\`javascript
// Environment-specific configuration
const getReplayConfigForEnvironment = (env) => {
  const configs = {
    development: {
      sessionSampleRate: 1.0,
      errorSampleRate: 1.0,
      maskAllText: false,
      maskAllInputs: false,
      debug: true
    },
    
    staging: {
      sessionSampleRate: 0.5,
      errorSampleRate: 1.0,
      maskAllText: false,
      maskAllInputs: true,
      debug: false
    },
    
    production: {
      sessionSampleRate: 0.05,
      errorSampleRate: 1.0,
      maskAllText: true,
      maskAllInputs: true,
      debug: false,
      beforeSend: (event) => {
        // Additional production filtering
        delete event.user?.ip_address;
        return event;
      }
    }
  };
  
  return configs[env] || configs.production;
};

// Initialize with environment config
const config = getReplayConfigForEnvironment(process.env.NODE_ENV);
const replayManager = new SessionReplayManager(config);
\`\`\`

#### Monitoring and Alerting
\`\`\`javascript
// Production monitoring for replay health
class ReplayHealthMonitor {
  constructor() {
    this.metrics = {
      eventRate: 0,
      errorRate: 0,
      memoryUsage: 0,
      networkUsage: 0
    };
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, 30000); // Every 30 seconds
  }
  
  collectMetrics() {
    // Collect replay performance metrics
    this.metrics = {
      eventRate: this.calculateEventRate(),
      errorRate: this.calculateErrorRate(),
      memoryUsage: this.getMemoryUsage(),
      networkUsage: this.getNetworkUsage()
    };
  }
  
  checkThresholds() {
    // Alert on high event rates
    if (this.metrics.eventRate > 1000) {
      this.sendAlert('high_event_rate', this.metrics.eventRate);
    }
    
    // Alert on high memory usage
    if (this.metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      this.sendAlert('high_memory_usage', this.metrics.memoryUsage);
    }
  }
  
  sendAlert(type, value) {
    // Send alert to monitoring system
    console.error(\`Replay alert: \${type} = \${value}\`);
    
    // Could integrate with your alerting system
    // alertingService.send({ type, value, timestamp: Date.now() });
  }
  
  calculateEventRate() {
    // Implementation for calculating events per second
    return 0;
  }
  
  calculateErrorRate() {
    // Implementation for calculating error rate
    return 0;
  }
  
  getMemoryUsage() {
    if ('memory' in performance) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }
  
  getNetworkUsage() {
    // Implementation for network usage tracking
    return 0;
  }
}

// Initialize health monitoring in production
if (process.env.NODE_ENV === 'production') {
  new ReplayHealthMonitor();
}
\`\`\`

This comprehensive setup guide covers all aspects of implementing session replay, from basic configuration to advanced production deployment strategies, ensuring you can capture valuable user session data while maintaining privacy and performance standards.`,

  lesson3: `# Privacy and Data Protection

## Understanding Privacy in Session Replay

Privacy and data protection are fundamental considerations when implementing session replay. This lesson covers comprehensive strategies for maintaining user privacy while maximizing the value of session replay data.

## Privacy by Design Principles

### Core Privacy Principles

#### 1. Data Minimization
Only collect the data you need for your specific use case:

\`\`\`javascript
// Implement selective recording based on page type
class PrivacyAwareReplay {
  constructor() {
    this.sensitivePages = [
      '/payment',
      '/checkout',
      '/profile',
      '/settings',
      '/admin'
    ];
    
    this.publicPages = [
      '/',
      '/about',
      '/contact',
      '/blog'
    ];
  }
  
  shouldRecordPage(path) {
    // Don't record sensitive pages
    if (this.sensitivePages.some(page => path.startsWith(page))) {
      return false;
    }
    
    // Record public pages with lower sampling
    if (this.publicPages.some(page => path.startsWith(page))) {
      return Math.random() < 0.05; // 5% sampling
    }
    
    // Default behavior for other pages
    return Math.random() < 0.02; // 2% sampling
  }
  
  getConfigForPage(path) {
    if (!this.shouldRecordPage(path)) {
      return { sessionSampleRate: 0 };
    }
    
    const baseConfig = {
      sessionSampleRate: 0.02,
      errorSampleRate: 1.0,
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true
    };
    
    // Enhanced privacy for sensitive areas
    if (this.sensitivePages.some(page => path.startsWith(page))) {
      return {
        ...baseConfig,
        sessionSampleRate: 0,
        beforeAddRecordingEvent: () => null // Block all events
      };
    }
    
    return baseConfig;
  }
}

// Usage with dynamic configuration
const privacyReplay = new PrivacyAwareReplay();

function initializeReplayForPage() {
  const currentPath = window.location.pathname;
  const config = privacyReplay.getConfigForPage(currentPath);
  
  if (config.sessionSampleRate > 0) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new Sentry.Replay(config)]
    });
  }
}
\`\`\`

#### 2. Purpose Limitation
Clearly define and limit the purposes for which replay data is used:

\`\`\`javascript
// Purpose-specific replay configurations
const REPLAY_PURPOSES = {
  BUG_FIXING: {
    sessionSampleRate: 0.01,
    errorSampleRate: 1.0,
    maskAllText: true,
    maskAllInputs: true,
    maxReplayDuration: 300000, // 5 minutes
    tags: { purpose: 'debugging' },
    retention: '30_days'
  },
  
  UX_RESEARCH: {
    sessionSampleRate: 0.05,
    errorSampleRate: 0.1,
    maskAllText: false,
    maskAllInputs: true,
    recordCanvas: true,
    tags: { purpose: 'ux_research' },
    retention: '90_days'
  },
  
  CUSTOMER_SUPPORT: {
    sessionSampleRate: 0,
    errorSampleRate: 0.5,
    maskAllText: true,
    maskAllInputs: true,
    requiresUserConsent: true,
    tags: { purpose: 'support' },
    retention: '7_days'
  }
};

function initializeReplayForPurpose(purpose, userConsent = {}) {
  const config = REPLAY_PURPOSES[purpose];
  
  if (!config) {
    throw new Error(\`Unknown replay purpose: \${purpose}\`);
  }
  
  // Check consent requirements
  if (config.requiresUserConsent && !userConsent.explicit) {
    config.sessionSampleRate = 0;
  }
  
  return new Sentry.Replay({
    ...config,
    beforeSend: (event) => {
      // Add purpose metadata
      event.tags = { ...event.tags, ...config.tags };
      event.extra = {
        ...event.extra,
        retention_policy: config.retention,
        purpose: purpose
      };
      return event;
    }
  });
}
\`\`\`

## Data Masking and Blocking

### Advanced Masking Strategies

#### Intelligent Text Masking
\`\`\`javascript
// Smart text masking based on content analysis
class IntelligentTextMasker {
  constructor() {
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
    };
    
    this.sensitiveKeywords = [
      'password', 'secret', 'token', 'key', 'auth',
      'private', 'confidential', 'sensitive', 'personal'
    ];
  }
  
  maskText(text, element) {
    if (!text || typeof text !== 'string') return text;
    
    // Check if element or its parents have sensitive indicators
    if (this.isElementSensitive(element)) {
      return '*'.repeat(text.length);
    }
    
    // Apply pattern-based masking
    let maskedText = text;
    
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      maskedText = maskedText.replace(pattern, (match) => {
        return this.getMaskForType(type, match);
      });
    });
    
    return maskedText;
  }
  
  isElementSensitive(element) {
    if (!element) return false;
    
    // Check element and its parents for sensitive indicators
    let current = element;
    while (current && current !== document.body) {
      // Check attributes
      const sensitiveAttrs = ['data-sensitive', 'data-private', 'data-confidential'];
      if (sensitiveAttrs.some(attr => current.hasAttribute(attr))) {
        return true;
      }
      
      // Check class names
      const className = current.className || '';
      if (this.sensitiveKeywords.some(keyword => 
        className.toLowerCase().includes(keyword))) {
        return true;
      }
      
      // Check input types
      if (current.type && ['password', 'email'].includes(current.type)) {
        return true;
      }
      
      current = current.parentElement;
    }
    
    return false;
  }
  
  getMaskForType(type, original) {
    const masks = {
      email: 'u***@***.com',
      phone: '***-***-****',
      ssn: '***-**-****',
      creditCard: '****-****-****-****',
      ipAddress: '***.***.***.***',
      uuid: '********-****-****-****-************'
    };
    
    return masks[type] || '*'.repeat(original.length);
  }
}

// Integration with Sentry Replay
const textMasker = new IntelligentTextMasker();

const privacyReplay = new Sentry.Replay({
  maskAllText: false, // We'll handle masking manually
  beforeAddRecordingEvent: (event) => {
    if (event.type === 'text' || event.type === 'input') {
      const maskedValue = textMasker.maskText(event.value, event.target);
      return {
        ...event,
        value: maskedValue
      };
    }
    return event;
  }
});
\`\`\`

#### Dynamic Element Blocking
\`\`\`javascript
// Dynamic blocking based on content and context
class DynamicElementBlocker {
  constructor() {
    this.blockingRules = [
      {
        name: 'payment_forms',
        selector: 'form[data-payment], .payment-form, #payment',
        reason: 'Contains payment information'
      },
      {
        name: 'user_profiles',
        selector: '.user-profile, .profile-info, [data-user-info]',
        reason: 'Contains personal information'
      },
      {
        name: 'admin_panels',
        selector: '.admin-panel, [role="admin"], .admin-content',
        reason: 'Administrative interface'
      },
      {
        name: 'sensitive_inputs',
        selector: 'input[type="password"], input[name*="ssn"], input[name*="credit"]',
        reason: 'Sensitive input fields'
      }
    ];
    
    this.dynamicRules = [];
  }
  
  addDynamicRule(selector, reason, condition = () => true) {
    this.dynamicRules.push({
      selector,
      reason,
      condition,
      timestamp: Date.now()
    });
  }
  
  getBlockedElements() {
    const blocked = [];
    
    // Apply static rules
    this.blockingRules.forEach(rule => {
      const elements = document.querySelectorAll(rule.selector);
      elements.forEach(element => {
        blocked.push({
          element,
          reason: rule.reason,
          rule: rule.name
        });
      });
    });
    
    // Apply dynamic rules
    this.dynamicRules.forEach(rule => {
      if (rule.condition()) {
        const elements = document.querySelectorAll(rule.selector);
        elements.forEach(element => {
          blocked.push({
            element,
            reason: rule.reason,
            rule: 'dynamic'
          });
        });
      }
    });
    
    return blocked;
  }
  
  createBlockingSelectors() {
    const blockedElements = this.getBlockedElements();
    return blockedElements.map(({ element }) => {
      // Generate unique selector for element
      return this.generateSelector(element);
    });
  }
  
  generateSelector(element) {
    if (element.id) {
      return \`#\${element.id}\`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        return \`.\${classes.join('.')}\`;
      }
    }
    
    // Fallback to tag name with nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      return \`\${element.tagName.toLowerCase()}:nth-child(\${index})\`;
    }
    
    return element.tagName.toLowerCase();
  }
  
  // Context-aware blocking
  addContextualBlocking() {
    // Block elements based on URL patterns
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/checkout')) {
      this.addDynamicRule(
        '.payment-method, .billing-address',
        'Checkout page payment information'
      );
    }
    
    if (currentPath.includes('/profile')) {
      this.addDynamicRule(
        '.personal-info, .contact-details',
        'User profile information'
      );
    }
    
    // Block based on user authentication state
    const isAuthenticated = this.checkAuthenticationState();
    if (isAuthenticated) {
      this.addDynamicRule(
        '.user-specific-content',
        'Authenticated user content'
      );
    }
  }
  
  checkAuthenticationState() {
    // Check for authentication indicators
    return (
      localStorage.getItem('authToken') ||
      document.cookie.includes('session') ||
      document.querySelector('[data-authenticated]')
    );
  }
}

// Usage with Sentry Replay
const elementBlocker = new DynamicElementBlocker();
elementBlocker.addContextualBlocking();

const privacyReplay = new Sentry.Replay({
  block: elementBlocker.createBlockingSelectors(),
  beforeAddRecordingEvent: (event) => {
    // Re-evaluate blocking rules for dynamic content
    const currentBlocked = elementBlocker.createBlockingSelectors();
    
    if (event.target && currentBlocked.some(selector => {
      try {
        return event.target.matches(selector);
      } catch (e) {
        return false;
      }
    })) {
      return null; // Block this event
    }
    
    return event;
  }
});
\`\`\`

## Consent Management

### GDPR-Compliant Consent System
\`\`\`javascript
// Comprehensive consent management for session replay
class ConsentManager {
  constructor() {
    this.consentTypes = {
      necessary: {
        required: true,
        description: 'Essential for website functionality',
        includes: ['error tracking for critical bugs']
      },
      functional: {
        required: false,
        description: 'Improves website functionality',
        includes: ['session replay for debugging']
      },
      analytics: {
        required: false,
        description: 'Helps us understand user behavior',
        includes: ['detailed session replay', 'user journey analysis']
      }
    };
    
    this.consent = this.loadConsent();
  }
  
  loadConsent() {
    const stored = localStorage.getItem('privacy_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if consent is still valid (e.g., within 12 months)
        if (Date.now() - parsed.timestamp < 365 * 24 * 60 * 60 * 1000) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse stored consent:', e);
      }
    }
    
    return {
      necessary: true,
      functional: false,
      analytics: false,
      timestamp: 0,
      version: 0
    };
  }
  
  saveConsent(consentChoices) {
    const consentData = {
      ...consentChoices,
      timestamp: Date.now(),
      version: this.getCurrentConsentVersion(),
      userAgent: navigator.userAgent,
      ip: this.getClientIP() // In practice, get from server
    };
    
    localStorage.setItem('privacy_consent', JSON.stringify(consentData));
    this.consent = consentData;
    
    // Update replay configuration based on new consent
    this.updateReplayConfig();
    
    // Log consent change for audit trail
    this.logConsentChange(consentData);
  }
  
  getCurrentConsentVersion() {
    return 1; // Increment when privacy policy changes
  }
  
  hasConsent(type) {
    return this.consent[type] === true;
  }
  
  requiresConsentPrompt() {
    return (
      this.consent.timestamp === 0 ||
      this.consent.version < this.getCurrentConsentVersion() ||
      this.isConsentExpired()
    );
  }
  
  isConsentExpired() {
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    return Date.now() - this.consent.timestamp > maxAge;
  }
  
  getReplayConfigFromConsent() {
    if (!this.hasConsent('functional')) {
      return {
        sessionSampleRate: 0,
        errorSampleRate: this.hasConsent('necessary') ? 0.1 : 0
      };
    }
    
    const baseConfig = {
      sessionSampleRate: 0.02,
      errorSampleRate: 1.0,
      maskAllText: !this.hasConsent('analytics'),
      maskAllInputs: true,
      blockAllMedia: !this.hasConsent('analytics')
    };
    
    if (this.hasConsent('analytics')) {
      return {
        ...baseConfig,
        sessionSampleRate: 0.05,
        recordCanvas: true,
        collectFonts: true,
        networkDetailAllowed: true
      };
    }
    
    return baseConfig;
  }
  
  updateReplayConfig() {
    const config = this.getReplayConfigFromConsent();
    
    // Reinitialize Sentry with new config
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new Sentry.Replay(config)]
    });
    
    // Log configuration change
    Sentry.addBreadcrumb({
      message: 'Replay configuration updated based on consent',
      category: 'consent',
      data: { hasAnalyticsConsent: this.hasConsent('analytics') }
    });
  }
  
  logConsentChange(consentData) {
    // Log consent changes for compliance audit
    Sentry.addBreadcrumb({
      message: 'User consent updated',
      category: 'privacy',
      data: {
        consentTypes: Object.keys(consentData).filter(key => 
          consentData[key] === true && key !== 'timestamp' && key !== 'version'
        ),
        timestamp: consentData.timestamp,
        version: consentData.version
      },
      level: 'info'
    });
  }
  
  showConsentPrompt() {
    return new Promise((resolve) => {
      const modal = this.createConsentModal(resolve);
      document.body.appendChild(modal);
    });
  }
  
  createConsentModal(onResolve) {
    const modal = document.createElement('div');
    modal.className = 'consent-modal';
    modal.innerHTML = \`
      <div class="consent-modal-backdrop">
        <div class="consent-modal-content">
          <h2>Privacy & Cookie Settings</h2>
          <p>We use session replay to improve our website and fix bugs. Please choose your preferences:</p>
          
          <div class="consent-options">
            <div class="consent-option">
              <label>
                <input type="checkbox" name="necessary" checked disabled>
                <strong>Necessary</strong> - Essential website functionality
              </label>
              <p>Required for error tracking and basic functionality.</p>
            </div>
            
            <div class="consent-option">
              <label>
                <input type="checkbox" name="functional" id="functional-consent">
                <strong>Functional</strong> - Session replay for debugging
              </label>
              <p>Helps us identify and fix issues you encounter.</p>
            </div>
            
            <div class="consent-option">
              <label>
                <input type="checkbox" name="analytics" id="analytics-consent">
                <strong>Analytics</strong> - Detailed usage analysis
              </label>
              <p>Provides insights into how our website is used to improve user experience.</p>
            </div>
          </div>
          
          <div class="consent-actions">
            <button id="accept-selected">Accept Selected</button>
            <button id="accept-all">Accept All</button>
            <button id="reject-optional">Only Necessary</button>
          </div>
          
          <p class="consent-footer">
            <a href="/privacy-policy" target="_blank">Privacy Policy</a> | 
            <a href="/cookie-policy" target="_blank">Cookie Policy</a>
          </p>
        </div>
      </div>
    \`;
    
    // Add event listeners
    modal.querySelector('#accept-selected').addEventListener('click', () => {
      const functional = modal.querySelector('#functional-consent').checked;
      const analytics = modal.querySelector('#analytics-consent').checked;
      
      this.saveConsent({
        necessary: true,
        functional,
        analytics
      });
      
      document.body.removeChild(modal);
      onResolve({ functional, analytics });
    });
    
    modal.querySelector('#accept-all').addEventListener('click', () => {
      this.saveConsent({
        necessary: true,
        functional: true,
        analytics: true
      });
      
      document.body.removeChild(modal);
      onResolve({ functional: true, analytics: true });
    });
    
    modal.querySelector('#reject-optional').addEventListener('click', () => {
      this.saveConsent({
        necessary: true,
        functional: false,
        analytics: false
      });
      
      document.body.removeChild(modal);
      onResolve({ functional: false, analytics: false });
    });
    
    return modal;
  }
  
  getClientIP() {
    // In practice, this should be handled server-side
    return 'xxx.xxx.xxx.xxx';
  }
}

// Usage
const consentManager = new ConsentManager();

async function initializePrivacyCompliantReplay() {
  if (consentManager.requiresConsentPrompt()) {
    await consentManager.showConsentPrompt();
  }
  
  const config = consentManager.getReplayConfigFromConsent();
  
  if (config.sessionSampleRate > 0) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new Sentry.Replay(config)]
    });
  }
}

// Initialize on page load
initializePrivacyCompliantReplay();
\`\`\`

## Data Retention and Deletion

### Automated Data Lifecycle Management
\`\`\`javascript
// Data retention policy implementation
class DataRetentionManager {
  constructor() {
    this.retentionPolicies = {
      debugging: {
        duration: 30 * 24 * 60 * 60 * 1000, // 30 days
        autoDelete: true,
        compressionAfter: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      
      analytics: {
        duration: 90 * 24 * 60 * 60 * 1000, // 90 days
        autoDelete: true,
        anonymizeAfter: 30 * 24 * 60 * 60 * 1000 // 30 days
      },
      
      legal_hold: {
        duration: 365 * 24 * 60 * 60 * 1000, // 1 year
        autoDelete: false,
        requiresManualReview: true
      }
    };
  }
  
  tagReplayWithRetention(purpose, userConsent = {}) {
    const policy = this.retentionPolicies[purpose];
    if (!policy) {
      throw new Error(\`Unknown retention purpose: \${purpose}\`);
    }
    
    return {
      beforeSend: (event) => {
        event.extra = {
          ...event.extra,
          retention: {
            purpose,
            policy: policy.duration,
            created_at: Date.now(),
            auto_delete: policy.autoDelete,
            user_consent: userConsent,
            anonymize_after: policy.anonymizeAfter
          }
        };
        
        return event;
      }
    };
  }
  
  requestDataDeletion(userId, reason = 'user_request') {
    // Implementation would integrate with your data processing system
    const deletionRequest = {
      userId,
      reason,
      timestamp: Date.now(),
      type: 'session_replay_data',
      status: 'pending'
    };
    
    // Log deletion request for audit trail
    Sentry.addBreadcrumb({
      message: 'Data deletion requested',
      category: 'privacy',
      data: deletionRequest,
      level: 'info'
    });
    
    return this.processDataDeletion(deletionRequest);
  }
  
  async processDataDeletion(request) {
    try {
      // In practice, this would call your data processing API
      console.log('Processing data deletion request:', request);
      
      // Update request status
      request.status = 'completed';
      request.completedAt = Date.now();
      
      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = error.message;
      throw error;
    }
  }
  
  scheduleAutomaticCleanup() {
    // Schedule periodic cleanup based on retention policies
    setInterval(() => {
      this.performCleanup();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }
  
  async performCleanup() {
    console.log('Performing scheduled data cleanup...');
    
    // This would typically run server-side
    // Implementation would query and delete expired replay data
    
    Sentry.addBreadcrumb({
      message: 'Automated data cleanup performed',
      category: 'data_management',
      data: {
        timestamp: Date.now(),
        policies_applied: Object.keys(this.retentionPolicies)
      }
    });
  }
}

// Usage
const retentionManager = new DataRetentionManager();

// Initialize replay with retention policy
const replayWithRetention = new Sentry.Replay({
  sessionSampleRate: 0.1,
  errorSampleRate: 1.0,
  ...retentionManager.tagReplayWithRetention('debugging', {
    functional: true,
    analytics: false
  })
});
\`\`\`

## Compliance and Auditing

### Audit Trail Implementation
\`\`\`javascript
// Comprehensive audit trail for privacy compliance
class PrivacyAuditLogger {
  constructor() {
    this.auditEvents = [];
    this.maxEvents = 1000;
  }
  
  logEvent(type, data, userId = null) {
    const event = {
      id: this.generateEventId(),
      type,
      userId,
      data,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.auditEvents.push(event);
    
    // Keep only recent events
    if (this.auditEvents.length > this.maxEvents) {
      this.auditEvents = this.auditEvents.slice(-this.maxEvents);
    }
    
    // Send to audit system
    this.sendToAuditSystem(event);
  }
  
  logConsentChange(oldConsent, newConsent, userId) {
    this.logEvent('consent_change', {
      old_consent: oldConsent,
      new_consent: newConsent,
      changes: this.getConsentChanges(oldConsent, newConsent)
    }, userId);
  }
  
  logDataAccess(dataType, purpose, userId) {
    this.logEvent('data_access', {
      data_type: dataType,
      purpose,
      access_method: 'session_replay'
    }, userId);
  }
  
  logDataDeletion(userId, reason, dataTypes) {
    this.logEvent('data_deletion', {
      reason,
      data_types: dataTypes,
      initiated_by: 'user'
    }, userId);
  }
  
  logPrivacyViolation(violationType, details, userId) {
    this.logEvent('privacy_violation', {
      violation_type: violationType,
      details,
      severity: 'high'
    }, userId);
    
    // Also send to Sentry for immediate attention
    Sentry.captureMessage(\`Privacy violation detected: \${violationType}\`, {
      level: 'error',
      extra: details,
      user: { id: userId }
    });
  }
  
  getConsentChanges(oldConsent, newConsent) {
    const changes = {};
    
    Object.keys(newConsent).forEach(key => {
      if (oldConsent[key] !== newConsent[key]) {
        changes[key] = {
          from: oldConsent[key],
          to: newConsent[key]
        };
      }
    });
    
    return changes;
  }
  
  generateEventId() {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  getSessionId() {
    return Sentry.getCurrentHub().getScope()?.getTransaction()?.traceId || 'unknown';
  }
  
  sendToAuditSystem(event) {
    // In practice, send to your audit/compliance system
    console.log('Audit event:', event);
    
    // Could also store in local storage for offline capability
    const stored = JSON.parse(localStorage.getItem('audit_events') || '[]');
    stored.push(event);
    
    // Keep only recent events in storage
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }
    
    localStorage.setItem('audit_events', JSON.stringify(stored));
  }
  
  generateComplianceReport() {
    const report = {
      report_id: this.generateEventId(),
      generated_at: Date.now(),
      period: {
        start: Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: Date.now()
      },
      metrics: this.calculateComplianceMetrics(),
      violations: this.getViolations(),
      consent_analytics: this.analyzeConsentPatterns()
    };
    
    return report;
  }
  
  calculateComplianceMetrics() {
    const recentEvents = this.auditEvents.filter(
      event => event.timestamp > Date.now() - (30 * 24 * 60 * 60 * 1000)
    );
    
    return {
      total_events: recentEvents.length,
      consent_changes: recentEvents.filter(e => e.type === 'consent_change').length,
      data_deletions: recentEvents.filter(e => e.type === 'data_deletion').length,
      privacy_violations: recentEvents.filter(e => e.type === 'privacy_violation').length,
      data_access_events: recentEvents.filter(e => e.type === 'data_access').length
    };
  }
  
  getViolations() {
    return this.auditEvents
      .filter(event => event.type === 'privacy_violation')
      .map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        type: event.data.violation_type,
        severity: event.data.severity
      }));
  }
  
  analyzeConsentPatterns() {
    const consentEvents = this.auditEvents.filter(e => e.type === 'consent_change');
    
    return {
      total_consent_changes: consentEvents.length,
      opt_in_rate: this.calculateOptInRate(consentEvents),
      opt_out_rate: this.calculateOptOutRate(consentEvents),
      most_common_changes: this.getMostCommonConsentChanges(consentEvents)
    };
  }
  
  calculateOptInRate(events) {
    const optIns = events.filter(event => 
      Object.values(event.data.changes).some(change => 
        !change.from && change.to
      )
    );
    
    return events.length > 0 ? optIns.length / events.length : 0;
  }
  
  calculateOptOutRate(events) {
    const optOuts = events.filter(event => 
      Object.values(event.data.changes).some(change => 
        change.from && !change.to
      )
    );
    
    return events.length > 0 ? optOuts.length / events.length : 0;
  }
  
  getMostCommonConsentChanges(events) {
    const changeTypes = {};
    
    events.forEach(event => {
      Object.keys(event.data.changes).forEach(changeType => {
        changeTypes[changeType] = (changeTypes[changeType] || 0) + 1;
      });
    });
    
    return Object.entries(changeTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }
}

// Usage
const auditLogger = new PrivacyAuditLogger();

// Integration with consent manager
const enhancedConsentManager = new ConsentManager();
enhancedConsentManager.onConsentChange = (oldConsent, newConsent, userId) => {
  auditLogger.logConsentChange(oldConsent, newConsent, userId);
};

// Integration with replay initialization
function initializeAuditedReplay() {
  auditLogger.logDataAccess('session_replay', 'debugging', 'current_user');
  
  // Initialize replay with audit logging
  const replay = new Sentry.Replay({
    sessionSampleRate: 0.1,
    errorSampleRate: 1.0,
    beforeAddRecordingEvent: (event) => {
      // Log potentially sensitive data access
      if (event.type === 'input' && event.target?.type === 'email') {
        auditLogger.logDataAccess('email_input', 'session_replay', 'current_user');
      }
      
      return event;
    }
  });
  
  return replay;
}
\`\`\`

This comprehensive privacy and data protection framework ensures that your session replay implementation respects user privacy, complies with regulations like GDPR, and maintains detailed audit trails for compliance reporting. The modular design allows you to customize privacy controls based on your specific requirements and regulatory environment.`
};

async function populateSessionReplayContent() {
  try {
    console.log('🎬 Populating Session Replay course content...');
    
    // Find the Session Replay course
    const sessionReplayCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.title, 'Understanding and implementing Session Replay'))
      .limit(1);
    
    if (sessionReplayCourse.length === 0) {
      console.error('❌ Session Replay course not found');
      return;
    }
    
    const courseId = sessionReplayCourse[0].id;
    console.log(`Found course: ${sessionReplayCourse[0].title} (ID: ${courseId})`);
    
    // Get existing lessons
    const existingLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    
    console.log(`Found ${existingLessons.length} existing lessons`);
    
    // Update lessons with rich content
    const lessonUpdates = [
      {
        title: 'What is Session Replay?',
        content: sessionReplayLessonContent.lesson1
      },
      {
        title: 'Setting Up Session Replay', 
        content: sessionReplayLessonContent.lesson2
      },
      {
        title: 'Privacy and Data Protection',
        content: sessionReplayLessonContent.lesson3
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
    
    console.log('🎉 Successfully populated Session Replay course content!');
    
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
    console.error('❌ Error populating Session Replay course content:', error);
  }
  
  process.exit(0);
}

populateSessionReplayContent();