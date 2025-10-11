# Chat Widget Service

A comprehensive live chat widget service with embeddable widget and admin dashboard built using modern technologies.

## Architecture

This project is a monorepo built with pnpm workspaces containing:

### Applications
- **backend**: NestJS API server with Socket.IO for real-time communication
- **widget**: React + Vite embeddable chat widget with Shadow DOM isolation
- **admin-dashboard**: React + TanStack Router admin interface

### Packages
- **ui**: Shared React component library
- **eslint-config-custom**: Shared ESLint configurations
- **tsconfig**: Shared TypeScript configurations

## Technology Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React, Vite, TanStack Router, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO
- **Widget Isolation**: Shadow DOM

## Quick Start

### Option 1: Run Individual Apps (Recommended)

1. **Admin Dashboard** (Ready to use):
   ```bash
   cd apps/admin-dashboard
   npm run dev
   ```
   Access at: http://localhost:5174

2. **Backend API** (If you have NestJS setup):
   ```bash
   cd apps/backend
   npm install
   npm run start:dev
   ```
   Access at: http://localhost:3001

3. **Chat Widget** (If configured):
   ```bash
   cd apps/widget
   npm install
   npm run dev
   ```
   Access at: http://localhost:5173

### Option 2: Use Convenience Scripts

1. **Start Admin Dashboard only**:
   ```bash
   ./start-admin.sh
   ```

2. **Start all services** (when all are configured):
   ```bash
   ./start-dev.sh
   ```

### Current Status
- ✅ **Admin Dashboard**: Fully implemented and ready to run
- 🔧 **Backend**: Needs NestJS setup and database configuration  
- ✅ **Widget**: Ready to run (standalone demo mode)

## Environment Setup

For the backend (when ready), create `apps/backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chat_widget"
JWT_SECRET="your-jwt-secret-here"
```

## Development Workflow

- **Format code**: `prettier --write "**/*.{ts,tsx,js,jsx,json,md}"`

## Project Structure

```
├── apps/
│   ├── backend/           # NestJS API server
│   ├── widget/            # Embeddable chat widget
│   └── admin-dashboard/   # Admin management interface
├── packages/
│   ├── ui/                # Shared React components
│   ├── eslint-config-custom/  # ESLint configs
│   └── tsconfig/          # TypeScript configs
├── package.json           # Root package.json
└── pnpm-workspace.yaml    # Workspace configuration
```

## Features

- **Embeddable Widget**: Shadow DOM isolated chat widget for any website
- **Real-time Messaging**: Socket.IO powered live communication
- **Admin Dashboard**: Comprehensive management interface
- **Authentication**: JWT-based authentication system
- **API Key Management**: Secure API key generation and validation
- **Modern UI**: Tailwind CSS styled components
- **Type Safety**: Full TypeScript coverage
- **Monorepo**: Efficient code sharing and development workflow
