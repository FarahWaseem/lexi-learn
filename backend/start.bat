@echo off
echo 🚀 Starting LexiLearn Backend...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    echo.
    echo 💡 To start Docker:
    echo    1. Open Docker Desktop
    echo    2. Wait for it to start completely
    echo    3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file...
    copy env.example .env
    echo ⚠️  Please update .env file with your settings
    echo.
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Start the application
echo 🐳 Starting services...
docker-compose up -d

echo.
echo ✅ Backend is starting up!
echo.
echo 📊 API Server: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo 🗄️  Database: PostgreSQL on localhost:5432
echo.
echo 📝 Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop: docker-compose down
echo   - Restart: docker-compose restart
echo.
echo 🎉 Backend is ready! You can now start the frontend.
echo.
pause
