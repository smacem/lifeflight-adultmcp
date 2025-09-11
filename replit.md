# EHS LifeFlight Adult MCP Self-Scheduler

## Overview

The EHS LifeFlight Adult MCP Self-Scheduler is a healthcare scheduling application designed for medical care providers (MCPs) in the EHS LifeFlight system. The platform enables physicians and learners to manage their monthly shift schedules, request shift trades, and provides administrators with tools to oversee scheduling operations and publish schedules publicly.

The application serves three primary user roles: physicians who can schedule up to 8 shifts per month, learners (medical students/residents) with customizable shift limits, and administrators who manage users and monthly settings. The system includes a public viewing component that allows external stakeholders to view published schedules through shareable links.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built as a React Single Page Application (SPA) using modern web technologies. The UI framework leverages shadcn/ui components with Radix UI primitives, providing a professional healthcare-grade interface with comprehensive accessibility support. The application uses React Router (wouter) for client-side routing and TanStack Query for state management and API communication.

The design system follows healthcare/enterprise standards inspired by Epic MyChart and Calendly, emphasizing clarity and reliability. The color palette uses EHS LifeFlight branding with a primary blue (210 85% 45%) and emergency red accent (0 85% 55%), complemented by professional grays and status colors. Typography primarily uses Inter font with Source Sans Pro for data tables.

Component architecture is modular with reusable UI components for calendar views, tables, forms, and administrative panels. The application supports both calendar grid and table view formats for schedule visualization, with responsive design considerations for mobile and desktop usage.

### Backend Architecture

The backend follows a REST API pattern using Express.js with TypeScript. The server implements a storage abstraction pattern with an IStorage interface that can be implemented by different storage providers (currently includes in-memory implementation for development).

The API layer handles CRUD operations for users, schedules, shift trades, and monthly settings. Session management uses connect-pg-simple for persistent sessions. The server includes middleware for request logging, error handling, and JSON/form data parsing.

Authentication and authorization are role-based, supporting physician, learner, and admin roles with different permission levels. The system includes public endpoint functionality for sharing published schedules via generated tokens.

### Data Storage Solutions

The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes tables for users, schedules, shift trades, and monthly settings with appropriate foreign key relationships and constraints.

User data includes role-based information (physician/learner/admin), contact details, shift limits, and active status. Schedule data tracks monthly assignments with day-specific entries linked to users. The shift trade system manages trade requests with status tracking (pending/approved/rejected/cancelled).

Monthly settings control publication status and public sharing capabilities through generated tokens. The schema uses PostgreSQL enums for role and status fields to ensure data integrity.

### External Dependencies

The application integrates with several key external services and libraries:

**Database & ORM:**
- Neon Database (PostgreSQL hosting service) via @neondatabase/serverless
- Drizzle ORM for database operations and migrations
- WebSocket support for real-time database connections

**UI Framework & Styling:**
- Radix UI component primitives for accessible interactions
- Tailwind CSS for responsive design and theming
- Lucide React for consistent iconography
- date-fns for date manipulation and formatting

**Development & Build Tools:**
- Vite for frontend build tooling and development server
- esbuild for backend bundling and production builds
- TypeScript for type safety across the full stack

**Client-Side Libraries:**
- React Hook Form with Zod validation for form management
- jsPDF for client-side PDF generation of schedules
- class-variance-authority for component variant management

**Server Infrastructure:**
- Express.js for HTTP server and API routing
- connect-pg-simple for PostgreSQL-backed session storage
- ws library for WebSocket connections to the database

The application is configured for deployment on Replit with environment-based configuration and includes development-specific tooling for enhanced debugging and error reporting.