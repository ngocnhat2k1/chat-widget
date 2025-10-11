#!/bin/bash

echo "🎯 Chat Widget Service - Quick Start"
echo "=================================="
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "🔄 Freeing up port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null
}

echo "Choose an option:"
echo "1) 🎛️  Start Admin Dashboard only (Recommended)"
echo "2) 🔧 Start Backend API"
echo "3) 💬 Start Chat Widget"
echo "4) 🚀 Start All Services"
echo "5) 🛑 Stop All Services"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🎛️ Starting Admin Dashboard..."
        if check_port 5174; then
            kill_port 5174
        fi
        cd apps/admin-dashboard
        echo "📦 Admin Dashboard will start at: http://localhost:5174"
        echo "⏹️  Press Ctrl+C to stop"
        npm run dev
        ;;
    2)
        echo ""
        echo "🔧 Starting Backend API..."
        if check_port 3001; then
            kill_port 3001
        fi
        cd apps/backend
        echo "📦 Backend API will start at: http://localhost:3001"
        echo "⚠️  Make sure you have PostgreSQL running and .env configured"
        echo "⏹️  Press Ctrl+C to stop"
        npm run dev 2>/dev/null || npm run start:dev
        ;;
    3)
        echo ""
        echo "💬 Starting Chat Widget..."
        if check_port 5173; then
            kill_port 5173
        fi
        cd apps/widget
        echo "📦 Chat Widget will start at: http://localhost:5173"
        echo "⏹️  Press Ctrl+C to stop"
        npm run dev
        ;;
    4)
        echo ""
        echo "🚀 Starting All Services..."
        
        # Kill existing processes
        echo "🔄 Cleaning up existing processes..."
        kill_port 5174
        kill_port 3001
        kill_port 5173
        
        echo "📦 Starting services in background..."
        
        # Start Admin Dashboard
        cd apps/admin-dashboard
        npm run dev > /dev/null 2>&1 &
        ADMIN_PID=$!
        echo "✅ Admin Dashboard started (PID: $ADMIN_PID) - http://localhost:5174"
        
        # Start Backend
        cd ../backend
        (npm run dev > /dev/null 2>&1 || npm run start:dev > /dev/null 2>&1) &
        BACKEND_PID=$!
        echo "✅ Backend API started (PID: $BACKEND_PID) - http://localhost:3001"
        
        # Start Widget
        cd ../widget
        npm run dev > /dev/null 2>&1 &
        WIDGET_PID=$!
        echo "✅ Chat Widget started (PID: $WIDGET_PID) - http://localhost:5173"
        
        cd ../..
        
        echo ""
        echo "🎉 All services are running!"
        echo "📍 Access points:"
        echo "   🎛️  Admin Dashboard: http://localhost:5174"
        echo "   🔧 Backend API:      http://localhost:3001"
        echo "   💬 Chat Widget:      http://localhost:5173"
        echo ""
        echo "📝 Process IDs: Admin($ADMIN_PID), Backend($BACKEND_PID), Widget($WIDGET_PID)"
        echo "🛑 To stop all services: kill $ADMIN_PID $BACKEND_PID $WIDGET_PID"
        echo ""
        echo "✨ Press Ctrl+C to stop all services..."
        
        # Create trap to kill all processes
        trap "echo ''; echo '🛑 Stopping all services...'; kill $ADMIN_PID $BACKEND_PID $WIDGET_PID 2>/dev/null; exit 0" INT
        
        # Wait for services to be killed
        wait
        ;;
    5)
        echo ""
        echo "🛑 Stopping all services..."
        kill_port 5174
        kill_port 3001
        kill_port 5173
        pkill -f "npm run dev" 2>/dev/null
        pkill -f "vite" 2>/dev/null
        pkill -f "nest start" 2>/dev/null
        echo "✅ All services stopped!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
