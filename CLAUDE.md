# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development
- `npm install` - Install dependencies
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Development
- `cd academy-server && bun install` - Install backend dependencies
- `cd academy-server && bun run index.ts` - Start backend server

## Architecture

### Frontend Structure
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Context API (AuthContext)
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library in `src/components/ui/`

### Key Directories
- `src/pages/` - Page components with routing
- `src/components/` - Reusable components organized by feature
- `src/contexts/` - React contexts for global state
- `src/data/` - Mock data and type definitions
- `src/types/` - TypeScript type definitions

### Authentication Flow
- AuthContext provides `login`, `logout`, and `user` state
- Protected routes check authentication status
- Mock login accepts any credentials (for development)

### Backend
- Minimal Bun server in `academy-server/`
- Currently serves as a placeholder for future API development

## Development Notes

### Adding New Features
- Pages go in `src/pages/` and should be added to routing in `App.tsx`
- Components should be organized by feature in `src/components/`
- All TypeScript types should be defined in `src/types/index.ts`
- Use existing UI components from `src/components/ui/` when possible

### Code Style
- ESLint is configured for TypeScript and React
- Run `npm run lint` before committing
- Follow existing component patterns for consistency