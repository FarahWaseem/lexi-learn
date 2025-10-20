@echo off
echo 🚀 Starting LexiLearn Frontend...
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ❌ Frontend directory not found!
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)

REM Navigate to frontend directory
cd frontend

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing frontend dependencies...
    npm install
    echo.
)

REM Start the frontend
echo 🎨 Starting React development server...
echo.
echo ✅ Frontend is starting up!
echo.
echo 📊 Frontend: http://localhost:3000
echo 📊 Backend API: http://localhost:3001
echo.
echo 🎉 Frontend is ready! You can now use the application.
echo.
npm start
