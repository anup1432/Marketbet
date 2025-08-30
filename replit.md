# Overview

This is a cryptocurrency price prediction trading platform that allows users to place bets on whether the price of Bitcoin will go up or down within short time intervals (20 seconds). The application features real-time price data, countdown timers, player activity tracking with bot simulation, and an admin panel for managing user transactions. Built with React (frontend) and Express.js (backend), it uses a PostgreSQL database with Drizzle ORM and features a modern UI built with shadcn/ui components and Tailwind CSS.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Built with TypeScript and Vite for fast development and optimized builds
- **Routing**: Uses wouter for lightweight client-side routing with routes for trading (`/`) and admin (`/admin`)
- **State Management**: React Query for server state management with automatic caching and background updates
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Real-time Updates**: Polling-based approach using React Query's refetch intervals for live data updates

## Backend Architecture
- **Express.js Server**: RESTful API server with middleware for logging, JSON parsing, and error handling
- **Storage Layer**: Abstract storage interface (`IStorage`) with in-memory implementation (`MemStorage`) for development
- **Game Engine**: Timer-based game loop that cycles between betting phase (20s) and result phase (5s)
- **Bot Simulation**: Automated bot players with realistic Indian names to simulate active trading environment

## Database Design
- **Users Table**: Stores user accounts with balance tracking
- **Games Table**: Records each trading round with start/end prices, results, and phase information
- **Bets Table**: Individual user bets with amount, side prediction, win/loss status, and bot simulation data
- **Transactions Table**: User deposit/withdraw requests with multi-network crypto support
- **Price History Table**: Historical price data for chart visualization

## Key Features
- **Real-time Trading**: 20-second betting windows with 5-second result phases
- **Multi-network Crypto Support**: TRC20, Polygon, TON, and BEP20 network integrations
- **Bot Ecosystem**: Simulated players to maintain platform activity and engagement
- **Admin Panel**: Transaction management system with approval/rejection capabilities
- **Responsive Design**: Mobile-first approach with adaptive layouts

# External Dependencies

## Core Frontend Dependencies
- **React Query**: Server state management and caching with automatic background updates
- **wouter**: Lightweight routing library for single-page application navigation
- **React Hook Form**: Form handling with validation and error management
- **date-fns**: Date manipulation and formatting utilities

## UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built component library combining Radix UI with Tailwind styling
- **Lucide React**: Icon library for consistent iconography

## Backend Dependencies
- **Drizzle ORM**: Type-safe SQL query builder and schema management
- **Zod**: Schema validation for API requests and database operations
- **express-session**: Session management for user authentication

## Database and Infrastructure
- **PostgreSQL**: Primary database configured through Neon serverless platform
- **Drizzle Kit**: Database migration and schema management tools
- **Vite**: Frontend build tool with hot reload for development
- **ESBuild**: Fast JavaScript bundler for production server builds

## Development Tools
- **TypeScript**: Static typing for enhanced development experience
- **Replit Integration**: Development environment optimization with cartographer plugin