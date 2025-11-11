# Mokdong A1 Science Academy Assessment System

## Overview

This is an OMR (Optical Mark Recognition) assessment system for Mokdong A1 Science Academy, specifically designed for physics education. The application enables students to:

- Log in using their student ID and name
- Select from multiple physics curriculum units
- Complete assessments by submitting answers
- View detailed results with performance analytics
- Track progress across multiple test attempts

The system automatically grades submissions against stored answer keys and provides immediate feedback with achievement rates, scores, and detailed answer comparisons.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with a custom design system based on Material Design principles
- Design emphasizes clarity and efficient navigation for educational contexts
- Typography system uses Inter for UI elements and JetBrains Mono for numerical data displays

**Routing**: Wouter for client-side routing with the following pages:
- Login page (/)
- Units selection page (/units)
- Test taking page (/test/:unit)
- Results display page (/result)
- Reports/analytics page (/reports)

**State Management**: 
- TanStack Query (React Query) for server state management
- Session storage for maintaining student authentication state and test results between page navigations
- No global state management library (relies on React Query cache and session storage)

**Data Visualization**: Recharts library for displaying student performance analytics with bar charts and line charts

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful JSON API with the following endpoints:
- POST /api/auth/login - Student authentication
- GET /api/questions/unit/:unit - Retrieve questions by curriculum unit
- POST /api/test/submit - Submit test answers for grading
- GET /api/results/:studentId - Retrieve student test history

**Session Management**: Currently using session storage on client-side; no server-side sessions implemented

**Error Handling**: Centralized error handling with structured JSON error responses

### Data Storage

**Database**: PostgreSQL (Neon serverless) accessed via connection pooling

**ORM**: Drizzle ORM for type-safe database operations

**Schema Design**:
- `students` table: Stores student credentials (ID, name, grade, phone)
- `questions` table: Answer key repository with question metadata (unit, type, correct answer, textbook)
- `test_results` table: Complete test submission records including student answers (JSON), scores, achievement rates, and timestamps

**Migrations**: Drizzle Kit for schema migrations stored in `/migrations` directory

### Authentication & Authorization

**Authentication Method**: Simple credential-based authentication using student ID and name lookup

**Security Considerations**:
- No password-based authentication (intentional design for educational context)
- Student identity verified through database lookup matching both ID and name
- Session maintained client-side in sessionStorage
- No JWT or token-based authentication implemented

**Access Control**: Students can only view/access their own test results (enforced through studentId filtering)

### External Dependencies

**Google Sheets Integration**:
- Google Sheets API v4 for reading student data and potentially writing results
- OAuth2 authentication using Replit Connectors system
- Functions: `getUncachableGoogleSheetClient()`, `readStudentsFromSheet()`
- Access token management with automatic refresh when expired

**Neon Database**:
- Serverless PostgreSQL database hosting
- WebSocket support for serverless environments
- Connection pooling via `@neondatabase/serverless` package

**Replit Platform Services**:
- Replit Connectors for managing Google OAuth credentials
- Vite plugins for Replit development environment (cartographer, dev banner, runtime error overlay)
- Environment-based identity tokens (REPL_IDENTITY, WEB_REPL_RENEWAL)

**Third-party Libraries**:
- React Hook Form with Zod resolvers for form validation
- date-fns for date formatting and manipulation
- Lucide React for iconography
- class-variance-authority and clsx for conditional styling