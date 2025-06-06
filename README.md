# Sentry Academy Workshop

This is a pnpm monorepo containing the Sentry Academy Workshop application.

## Structure

```
├── apps/
│   ├── frontend/          # React + Vite frontend application
│   └── server/            # Node.js + Express backend server
├── scripts/               # Shared utility scripts
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── package.json           # Root workspace package.json
```

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v9 or higher)

## Getting Started

1. Install dependencies for all packages:
   ```bash
   pnpm install
   ```

2. Start both frontend and server in development mode:
   ```bash
   pnpm dev
   ```

3. Or start them individually:
   ```bash
   # Start only frontend
   pnpm dev:frontend
   
   # Start only server
   pnpm dev:server
   ```

## Available Scripts

### Root Level Scripts

- `pnpm dev` - Start both frontend and server in development mode
- `pnpm dev:frontend` - Start only the frontend application
- `pnpm dev:server` - Start only the server application
- `pnpm build` - Build both applications
- `pnpm build:frontend` - Build only the frontend
- `pnpm build:server` - Build only the server
- `pnpm lint` - Run linting on all packages

### Frontend (`apps/frontend`)

- `pnpm dev` - Start Vite development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build

### Server (`apps/server`)

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:*` - Database-related commands (generate, migrate, push, studio, seed)

## Development

The frontend runs on `http://localhost:5173` and the server runs on `http://localhost:3000` by default.

Both applications are configured with Sentry for error monitoring and performance tracking. 