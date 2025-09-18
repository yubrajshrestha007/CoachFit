# Overview

CoachFit is a modern fitness tracking web application built to help users manage their workout routines and track progress. The app provides structured workout programs with detailed exercise logging, recovery monitoring, and progress visualization. It features a clean, mobile-first design with a focus on simplicity and ease of use during workouts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js for the REST API server
- **Language**: TypeScript throughout the entire application for consistency
- **API Pattern**: RESTful endpoints with proper HTTP status codes and error handling
- **Middleware**: Express middleware for JSON parsing, URL encoding, and request logging
- **Development**: Hot module replacement and development server integration with Vite

## Data Storage Solutions
- **Database**: PostgreSQL as the primary relational database
- **ORM**: Drizzle ORM for type-safe database interactions and migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting
- **Schema**: Comprehensive workout tracking schema including users, workout days, exercises, sessions, sets, recovery logs, and personal records
- **Validation**: Zod schemas for runtime type validation and data integrity

## Authentication and Authorization
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **User System**: Basic username/password authentication with hashed passwords
- **Authorization**: User-specific data access controls for workout sessions and progress tracking

## External Dependencies
- **Database Hosting**: Neon Database for serverless PostgreSQL
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Charts**: Recharts for progress visualization and analytics
- **Icons**: Lucide React for consistent iconography
- **Development Tools**: Replit-specific plugins for enhanced development experience
- **Form Handling**: React Hook Form with Hookform resolvers for form validation
- **Date Utilities**: date-fns for date manipulation and formatting

The application follows a monorepo structure with shared TypeScript schemas between client and server, ensuring type safety across the entire stack. The architecture prioritizes developer experience with hot reloading, comprehensive error handling, and clear separation of concerns between frontend, backend, and shared utilities.