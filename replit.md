# Logistics Order Management System

## Overview

This is a comprehensive logistics and order management system built with a modern full-stack architecture. The application provides enterprise-level functionality for managing orders, tracking shipments, customer relationships, and carrier operations. It features a professional dashboard interface inspired by productivity tools like Linear and Notion, optimized for logistics industry workflows with real-time tracking capabilities and comprehensive data management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design system following enterprise productivity tool patterns
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Design System**: Purple-themed color palette (270° hue) with neutral grays, following the "new-york" shadcn style

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful API structure with centralized error handling
- **Development**: Hot reload with tsx and Vite integration

### Database Schema Design
- **Users**: Authentication and role-based access control
- **Customers**: Customer profile and contact information management
- **Carriers**: Logistics provider information and service areas
- **Drivers**: Driver profiles with license tracking and real-time status
- **Orders**: Core order management with status tracking and relationships
- **Order Tracking Events**: Detailed audit trail for order lifecycle events
- **Enums**: Strongly typed status fields (order_status, payment_status, driver_status)

### Authentication & Authorization
- **JWT Tokens**: Stored in localStorage with automatic header injection
- **Role-based Access**: Admin and user roles with expandable permission system
- **Session Management**: Automatic logout on 401 responses with query cache clearing
- **Password Security**: bcrypt hashing with salt rounds for secure storage

### Component Architecture
- **Layout System**: Sidebar navigation with responsive mobile drawer
- **Data Tables**: Comprehensive CRUD operations with search, filtering, and pagination
- **Modal System**: Dialog-based forms for creating and editing entities
- **Metrics Dashboard**: Real-time analytics cards with query-based data fetching
- **Tracking Interface**: Driver status management with visual status indicators

## External Dependencies

### Database
- **Neon Database**: PostgreSQL-compatible serverless database with connection pooling
- **Migration System**: Drizzle Kit for schema migrations and database management

### UI and Styling
- **shadcn/ui**: Complete component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Consistent icon system throughout the application
- **Google Fonts**: Inter font family for clean, readable typography

### Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **ESBuild**: Production bundling for server-side code
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility

### Production Services
- **Replit Integration**: Development environment with runtime error overlay
- **Environment Variables**: Secure configuration management for DATABASE_URL and JWT_SECRET

### Form and Validation
- **React Hook Form**: Performant form handling with minimal re-renders
- **Zod**: Runtime type validation for API requests and form data
- **Hookform Resolvers**: Integration between React Hook Form and Zod schemas