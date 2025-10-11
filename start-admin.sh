#!/bin/bash

echo "🎛️ Starting Admin Dashboard Development Server..."

# Navigate to admin dashboard directory
cd "$(dirname "$0")/apps/admin-dashboard"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📋 Installing dependencies..."
    npm install --no-package-lock
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies. Trying to fix..."
        
        # Remove package-lock.json if it exists
        rm -f package-lock.json
        
        # Clear npm cache
        npm cache clean --force
        
        # Try again
        npm install --no-package-lock --legacy-peer-deps
    fi
fi

echo "🚀 Starting development server..."
npm run dev

echo "✅ Admin Dashboard should be running on http://localhost:5174"
