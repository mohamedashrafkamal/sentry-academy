# Sentry Academy Workshop: Debugging SSO Authentication Failures

A hands-on workshop demonstrating realistic debugging scenarios for SSO authentication and search functionality failures using Sentry monitoring and distributed tracing.

## 🎯 Workshop Overview

This workshop simulates real-world scenarios where frontend and backend teams have miscommunications about API contracts, leading to authentication and search failures. Both applications include Sentry monitoring to automatically capture and debug these errors.

### Workshop Scenarios

1. **JWT Authentication Debugging** - SSO login failures due to missing login signatures
2. **Search Functionality Debugging** - API parameter mismatches with distributed tracing

## 🏗️ Architecture

This is a **pnpm monorepo** with two main applications:

```
├── apps/
│   ├── frontend/          # React + Vite frontend application
│   └── server/            # Node.js + Express backend server
├── scripts/               # Shared utility scripts
├── workshop.md            # Detailed workshop instructions
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── package.json           # Root workspace package.json
```

### Technology Stack

#### Frontend Application (`@sentry-academy/frontend`)
- **Framework:** React 19.1.0 with React DOM
- **Build Tool:** Vite 5.4.2
- **Language:** TypeScript 5.5.3
- **Styling:** Tailwind CSS 4.1.8
- **Routing:** React Router DOM 7.6.2
- **Icons:** Lucide React 0.513.0
- **Markdown:** React Markdown 10.1.0 with syntax highlighting
- **Monitoring:** Sentry React SDK 9.26.0
- **Linting:** ESLint 9.9.1 with React-specific plugins

#### Backend Application (`@sentry-academy/server`)
- **Runtime:** Node.js with Express 5.1.0
- **Language:** TypeScript 5.0.0
- **Database:** PostgreSQL with Drizzle ORM 0.44.2
- **Build Tool:** esbuild 0.25.5
- **Development:** tsx 4.0.0 for hot reload
- **Monitoring:** Sentry Node SDK 9.26.0 with profiling
- **Security:** CORS enabled for cross-origin requests
- **ID Generation:** @paralleldrive/cuid2 2.2.2

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v9 or higher)
- **PostgreSQL** (for database functionality)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd sentry-academy
   pnpm install
   ```

2. **Environment Setup:**
   Create `.env` files in both applications:
   
   **Frontend (`apps/frontend/.env`):**
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_SENTRY_DSN=your-sentry-dsn
   ```
   
   **Server (`apps/server/.env`):**
   ```env
   PORT=3001
   DATABASE_URL=postgresql://username:password@localhost:5432/sentry_academy
   SENTRY_DSN=your-sentry-dsn
   ```

3. **Database Setup:**
   ```bash
   # Navigate to server directory
   cd apps/server
   
   # Generate database schema
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Seed database with sample data
   pnpm db:seed
   ```

### Development

1. **Start both applications:**
   ```bash
   pnpm dev
   ```
   
   This starts:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

2. **Or start individually:**
   ```bash
   # Start only frontend
   pnpm dev:frontend
   
   # Start only backend  
   pnpm dev:server
   ```

3. **Access the application:**
   - Open your browser to `http://localhost:5173`
   - You'll see the login form with SSO options

## 🛠️ Available Scripts

### Root Level Scripts
- `pnpm dev` - Start both frontend and server in development mode
- `pnpm dev:frontend` - Start only the frontend application
- `pnpm dev:server` - Start only the server application
- `pnpm build` - Build both applications for production
- `pnpm build:frontend` - Build only the frontend
- `pnpm build:server` - Build only the server
- `pnpm lint` - Run linting on all packages

### Frontend Scripts (`apps/frontend`)
- `pnpm dev` - Start Vite development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build

### Server Scripts (`apps/server`)
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production using esbuild
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:create-readonly-user` - Create read-only database user

## 🐛 Workshop Modules

### Module 1: JWT Authentication Debugging

**Scenario:** Frontend generates JWT tokens from SSO providers but doesn't always send them to the backend, causing authentication failures.

**Key Learning Points:**
- API contract mismatches between teams
- JWT token flow and validation
- Unhandled error debugging
- Sentry error capture and analysis

**Steps:**
1. Try SSO login (Google, Microsoft, Okta)
2. Observe backend crashes from `JSON.parse(atob(undefined))`
3. Debug using API testing
4. Fix missing login signature issues

### Module 2: Search Functionality with Distributed Tracing

**Scenario:** Frontend and backend teams have different assumptions about search API parameters, leading to "no results found" errors.

**Key Learning Points:**
- Search API integration patterns
- Parameter name mismatches (`query` vs `q`)
- Distributed tracing implementation
- Performance monitoring with spans

**Steps:**
1. Experience search failures
2. Implement custom tracing spans
3. Analyze trace data to identify root cause
4. Fix parameter mismatches

## 🔍 API Endpoints

The server provides several API endpoints:

- `GET /api/courses` - List all courses
- `GET /api/search/courses?q=term` - Search courses
- `POST /api/auth/sso/:provider` - SSO authentication
- `GET /api/lessons` - List lessons
- `GET /api/users` - List users
- `GET /api/enrollments` - List enrollments

## 📊 Monitoring & Observability

Both applications are pre-configured with **Sentry** for:

### Frontend Monitoring
- React error boundaries
- Performance monitoring
- User session tracking
- Custom event tracking

### Backend Monitoring  
- Express.js error handling
- Database query performance
- API endpoint monitoring
- Profiling and performance metrics

### Distributed Tracing
- Custom spans for API calls
- Database operation tracing
- Search functionality tracing
- Authentication flow tracking

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:
- **Users** - User accounts and profiles
- **Courses** - Course catalog with instructors
- **Lessons** - Individual lessons within courses
- **Enrollments** - User course enrollments

Database operations are handled through Drizzle ORM with full TypeScript support.

## 🧪 Testing the Workshop

1. **Authentication Errors:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/sso/google \
     -H "Content-Type: application/json" \
     -d '{"userData": {"email": "test@example.com", "name": "Test User"}}'
   ```

2. **Search API Testing:**
   ```bash
   # This will fail (missing query parameter)
   curl -X GET "http://localhost:3001/api/search/courses"
   
   # This will succeed
   curl -X GET "http://localhost:3001/api/search/courses?q=javascript"
   ```

## 🎓 Learning Outcomes

After completing this workshop, you'll understand:

- ✅ Real-world API contract debugging
- ✅ JWT authentication flows and common pitfalls
- ✅ Search API implementation patterns
- ✅ Error monitoring with Sentry
- ✅ Distributed tracing for microservices
- ✅ Frontend/backend communication debugging
- ✅ Production debugging workflows

## 📚 Additional Resources

- **Workshop Guide:** See `workshop.md` for detailed step-by-step instructions
- **Sentry Documentation:** [docs.sentry.io](https://docs.sentry.io)
- **Drizzle ORM:** [orm.drizzle.team](https://orm.drizzle.team)
- **React 19 Features:** [react.dev](https://react.dev)

## 🤝 Contributing

This is a workshop project designed for learning. Feel free to experiment with:
- Adding new authentication providers
- Implementing additional search filters
- Creating custom Sentry integrations
- Extending the tracing implementation

---

**Happy Debugging! 🐛🔍** 