#!/bin/bash

echo "🚀 Starting Chat Widget Development Servers..."

# Function to run command in background and capture PID
run_app() {
    local app_name=$1
    local app_path=$2
    local port=$3
    
    echo "📦 Starting $app_name on port $port..."
    cd "$app_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📋 Installing dependencies for $app_name..."
        npm install --no-package-lock
    fi
    
    # Start the app
    npm run dev &
    local pid=$!
    echo "✅ $app_name started with PID: $pid"
    
    # Return to original directory
    cd - > /dev/null
    
    return $pid
}

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Start Backend (NestJS)
echo "🔧 Starting Backend API..."
cd "$SCRIPT_DIR/apps/backend"
if [ ! -d "node_modules" ]; then
    echo "📋 Installing backend dependencies..."
    npm install --no-package-lock
fi
npm run start:dev &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID on http://localhost:3001"

# Start Admin Dashboard (React + Vite)
echo "🎛️ Starting Admin Dashboard..."
cd "$SCRIPT_DIR/apps/admin-dashboard"
if [ ! -d "node_modules" ]; then
    echo "📋 Installing admin dashboard dependencies..."
    npm install --no-package-lock
fi
npm run dev &
ADMIN_PID=$!
echo "✅ Admin Dashboard started with PID: $ADMIN_PID on http://localhost:5174"

# Start Widget (React + Vite)
echo "💬 Starting Chat Widget..."
cd "$SCRIPT_DIR/apps/widget"
if [ ! -d "node_modules" ]; then
    echo "📋 Installing widget dependencies..."
    npm install --no-package-lock
fi
npm run dev &
WIDGET_PID=$!
echo "✅ Chat Widget started with PID: $WIDGET_PID on http://localhost:5173"

# Return to original directory
cd "$SCRIPT_DIR"

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📍 Services running on:"
echo "   🔧 Backend API:      http://localhost:3001"
echo "   🎛️ Admin Dashboard:   http://localhost:5174"
echo "   💬 Chat Widget:      http://localhost:5173"
echo ""
echo "📝 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Admin:   $ADMIN_PID"
echo "   Widget:  $WIDGET_PID"
echo ""
echo "⏹️ To stop all services, run: kill $BACKEND_PID $ADMIN_PID $WIDGET_PID"
echo "   Or press Ctrl+C and then run: pkill -f 'npm run'"
echo ""

# Wait for user to stop
echo "✨ Press Ctrl+C to stop all services..."
trap "echo '🛑 Stopping all services...'; kill $BACKEND_PID $ADMIN_PID $WIDGET_PID 2>/dev/null; exit" INT

# Keep script running
wait
