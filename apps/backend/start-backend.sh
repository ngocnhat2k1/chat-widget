#!/bin/bash

# Backend Startup Script for Frontend Developers
# This script handles all the complex backend setup automatically

echo "🚀 Starting Chat Widget Backend..."
echo "📁 Working directory: $(pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

print_status "Docker is running"

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please ensure .env file exists."
    exit 1
fi

print_status ".env file found"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_warning "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_status "Dependencies installed"
fi

# Start database with Docker Compose
print_warning "Starting PostgreSQL database..."
docker-compose up -d
if [ $? -ne 0 ]; then
    print_error "Failed to start database"
    exit 1
fi

print_status "Database started"

# Wait for database to be ready
print_warning "Waiting for database to be ready..."
sleep 5

# Check database connection
timeout=30
counter=0
while ! docker-compose exec postgres pg_isready -U chatuser -d chat_widget > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        print_error "Database failed to start within ${timeout} seconds"
        exit 1
    fi
    echo "Waiting for database... (${counter}/${timeout})"
    sleep 1
done

print_status "Database is ready"

# Generate Prisma client
print_warning "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi

print_status "Prisma client generated"

# Run database migrations
print_warning "Running database migrations..."
npx prisma db push
if [ $? -ne 0 ]; then
    print_error "Failed to run database migrations"
    exit 1
fi

print_status "Database migrations completed"

# Seed database with initial data
print_warning "Seeding database with initial data..."
npm run db:seed
if [ $? -ne 0 ]; then
    print_warning "Database seeding failed (this might be okay if seed script doesn't exist)"
fi

print_status "Database setup completed"

# Start the backend server
print_status "🎉 Starting NestJS backend server..."
echo ""
echo "📍 Backend will be available at: http://localhost:3001"
echo "📍 Database: PostgreSQL running in Docker"
echo "📍 Environment: Development"
echo ""
echo "🔗 Your widget can now connect to the backend!"
echo ""

# Start the development server
npm run dev
