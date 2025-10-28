@echo off
echo 🚀 Starting LexiLearn Full Project...
echo.

REM Check if we're in the right directory
if not exist "backend\docker-compose.yml" (
    echo ❌ Backend directory not found!
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)

echo 📋 Starting LexiLearn Development Environment
echo ==========================================
echo.

REM Step 1: Start Backend
echo 🔧 Step 1: Starting Backend...
cd backend
call start.bat
if %errorlevel% neq 0 (
    echo ❌ Backend failed to start
    pause
    exit /b 1
)

echo.
echo ✅ Backend is running!
echo.

REM Step 2: Start Frontend
echo 🎨 Step 2: Starting Frontend...
cd ..\frontend

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing frontend dependencies...
    npm install
    echo.
)

echo 🎨 Starting React development server...
echo.
echo ✅ Frontend is starting up!
echo.
echo 📊 Frontend: http://localhost:3000
echo 📊 Backend API: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo.
echo 🎉 LexiLearn is ready! You can now use the application.
echo.
echo 📝 To stop the services:
echo   - Press Ctrl+C to stop frontend
echo   - Run 'docker-compose down' in backend folder to stop backend
echo.

npm start
