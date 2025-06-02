# BUILD_PLAN.md

## Project Overview
Transform the Sentry Academy scaffold into a production-ready education platform focused on observability, monitoring, and error handling training.

## Current State Analysis
- **Frontend**: React + TypeScript + Vite with mock data and basic UI
- **Backend**: Minimal Bun server with no implementation
- **Auth**: Mock authentication in frontend only
- **Data**: Static course data in frontend

## Core Features to Implement

### Phase 1: Foundation (Weeks 1-3)
#### 1.1 Backend API Architecture
**Recommendations:**
- **Framework**: Use Bun with Elysia.js for type-safe, fast API development
- **Database**: PostgreSQL with Drizzle ORM (lightweight, TypeScript-first)
- **API Structure**: RESTful with potential GraphQL layer later
- **File Structure**:
  ```
  academy-server/
  ├── src/
  │   ├── db/
  │   │   ├── schema/
  │   │   ├── migrations/
  │   │   └── seed/
  │   ├── modules/
  │   │   ├── auth/
  │   │   ├── courses/
  │   │   ├── users/
  │   │   └── lessons/
  │   ├── middleware/
  │   ├── utils/
  │   └── index.ts
  ```

#### 1.2 Authentication & Authorization
**Recommendations:**
- **Auth Provider**: Implement JWT with refresh tokens
- **Social Login**: Add GitHub/Google OAuth (developers love this)
- **Roles**: Student, Instructor, Admin, Guest
- **Sessions**: Redis for session management
- **2FA**: Optional for instructors/admins

#### 1.3 Database Schema
**Core Tables:**
```sql
- users (id, email, name, role, avatar_url, created_at)
- courses (id, title, description, instructor_id, price, status)
- lessons (id, course_id, title, content_type, content_url, order)
- enrollments (user_id, course_id, enrolled_at, completed_at)
- progress (user_id, lesson_id, completed_at, time_spent)
- certificates (id, user_id, course_id, issued_at, certificate_url)
```

### Phase 2: Content Management (Weeks 4-6)
#### 2.1 Course Management
**Features:**
- CRUD operations for courses/lessons
- Rich text editor for lesson content (Tiptap recommended)
- Video hosting integration (Cloudflare Stream or Mux)
- File uploads for resources (PDFs, code samples)
- Course versioning for updates

#### 2.2 Content Delivery
**Recommendations:**
- **Video**: Cloudflare Stream for adaptive bitrate streaming
- **Code Samples**: Monaco Editor integration for interactive code
- **Storage**: S3-compatible storage (Cloudflare R2 recommended)
- **CDN**: Cloudflare for global content delivery

#### 2.3 Learning Experience
**Features:**
- Progress tracking with visual indicators
- Bookmarks and notes per lesson
- Code playground for hands-on exercises
- Quiz/assessment system
- Discussion threads per lesson

### Phase 3: User Experience (Weeks 7-9)
#### 3.1 Student Features
- Personal dashboard with enrolled courses
- Learning paths and recommendations
- Achievement badges and streaks
- Course completion certificates
- Offline video download (premium feature)

#### 3.2 Instructor Tools
- Course analytics dashboard
- Student progress monitoring
- Announcement system
- Revenue tracking
- Bulk content upload

#### 3.3 Search & Discovery
- Full-text search with Elasticsearch/Meilisearch
- AI-powered course recommendations
- Category and tag filtering
- Skill-based course matching

### Phase 4: Monetization (Weeks 10-11)
#### 4.1 Payment Integration
**Recommendations:**
- **Provider**: Stripe for payments and subscriptions
- **Models**: 
  - Individual course purchase
  - Monthly/yearly subscriptions
  - Team/enterprise plans
  - Free tier with limited access

#### 4.2 Pricing Features
- Discount codes and promotions
- Regional pricing
- Bundle offers
- Referral program
- Corporate accounts

### Phase 5: Advanced Features (Weeks 12+)
#### 5.1 Live Learning
- Live coding sessions with screen share
- Interactive Q&A during streams
- Session recordings for later viewing
- Calendar integration

#### 5.2 Community Features
- Discussion forums
- Study groups
- Peer code reviews
- Mentorship matching

#### 5.3 Enterprise Features
- SSO integration (SAML/OIDC)
- Team management
- Custom branding
- API access for LMS integration
- Compliance reporting

## Technical Decisions

### Backend Stack
```json
{
  "runtime": "Bun",
  "framework": "Elysia.js",
  "database": "PostgreSQL",
  "orm": "Drizzle",
  "cache": "Redis",
  "queue": "BullMQ",
  "storage": "Cloudflare R2",
  "email": "Resend",
  "monitoring": "Sentry (dogfooding!)"
}
```

### Frontend Enhancements
```json
{
  "state": "Zustand (simpler than Redux)",
  "forms": "React Hook Form + Zod",
  "tables": "TanStack Table",
  "charts": "Recharts",
  "video": "Video.js with quality selector",
  "code": "Monaco Editor",
  "animations": "Framer Motion"
}
```

### Infrastructure
```json
{
  "hosting": "Vercel (frontend) + Railway (backend)",
  "database": "Neon or Supabase",
  "cdn": "Cloudflare",
  "monitoring": "Sentry + Datadog",
  "ci/cd": "GitHub Actions"
}
```

## API Design

### RESTful Endpoints
```
GET    /api/courses          # List courses
GET    /api/courses/:id      # Get course details
POST   /api/courses          # Create course (instructor)
PUT    /api/courses/:id      # Update course
DELETE /api/courses/:id      # Delete course

GET    /api/courses/:id/lessons      # List lessons
GET    /api/lessons/:id              # Get lesson
POST   /api/lessons/:id/complete     # Mark complete

POST   /api/enrollments              # Enroll in course
GET    /api/users/me/enrollments     # My courses
GET    /api/users/me/progress        # My progress
```

## Development Workflow

### 1. Environment Setup
```bash
# Backend
cd academy-server
bun install elysia @elysiajs/cors @elysiajs/jwt drizzle-orm postgres
bun install -d drizzle-kit @types/bun

# Frontend additions
npm install zustand react-hook-form @hookform/resolvers zod
npm install @tanstack/react-table recharts framer-motion
```

### 2. Development Process
- Feature branches with PR reviews
- Automated testing (Vitest + Playwright)
- Staging environment for QA
- Feature flags for gradual rollout
- Automated database migrations

### 3. Monitoring Strategy
- Sentry for error tracking (obviously!)
- Custom dashboards for learning analytics
- Performance monitoring for video streaming
- User behavior analytics (privacy-conscious)

## Security Considerations

1. **API Security**
   - Rate limiting per endpoint
   - Input validation with Zod
   - SQL injection prevention (parameterized queries)
   - XSS protection (Content-Security-Policy)

2. **Content Protection**
   - Signed URLs for video content
   - Download prevention for premium content
   - Watermarking for downloaded materials

3. **Data Privacy**
   - GDPR compliance
   - Data encryption at rest
   - Regular security audits
   - PII handling procedures

## Performance Targets

- Page load: < 2s (LCP)
- Video start: < 3s
- API response: < 200ms (p95)
- Search results: < 500ms
- 99.9% uptime SLA

## Success Metrics

1. **User Engagement**
   - Course completion rate > 60%
   - Daily active users
   - Average session duration
   - Return visitor rate

2. **Business Metrics**
   - Monthly recurring revenue
   - Customer acquisition cost
   - Lifetime value
   - Churn rate < 5%

3. **Technical Metrics**
   - Error rate < 0.1%
   - Apdex score > 0.9
   - Core Web Vitals passing
   - API availability > 99.9%

## Next Steps

1. **Immediate Actions**
   - Set up Elysia.js backend structure
   - Design and implement database schema
   - Create authentication system
   - Build API endpoints for courses

2. **Week 1 Deliverables**
   - Working auth flow
   - Course CRUD API
   - Database migrations setup
   - Basic API documentation

3. **Decision Points**
   - Choose video hosting provider
   - Finalize payment provider
   - Select deployment platform
   - Determine launch features vs. post-launch

## Risk Mitigation

1. **Technical Risks**
   - Bun ecosystem maturity → Have Node.js fallback plan
   - Video streaming costs → Implement usage limits
   - Database scaling → Design for horizontal scaling

2. **Business Risks**
   - Content piracy → DRM consideration
   - Instructor quality → Review process
   - Platform abuse → Moderation tools

3. **Operational Risks**
   - Support burden → Self-service features
   - Content updates → Version control system
   - Scaling team → Clear documentation

## Questions to Address

1. What's the target audience size?
2. Free tier limitations?
3. Content licensing model?
4. Mobile app priority?
5. Internationalization timeline?
6. Partnership opportunities?
7. Open-source components?

This plan provides a roadmap to transform Sentry Academy from a demo to a production-ready platform. Each phase builds upon the previous, allowing for iterative development and early user feedback.