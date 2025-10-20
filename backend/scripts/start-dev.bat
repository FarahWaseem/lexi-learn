@echo off
REM LexiLearn Backend Development Startup Script for Windows

echo 🚀 Starting LexiLearn Backend Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please update the .env file with your configuration
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Start services with Docker Compose
echo 🐳 Starting services with Docker Compose...
docker-compose up -d

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Check if database is accessible
echo 🔍 Checking database connection...
npm run migrate

echo ✅ Development environment is ready!
echo 📊 API Server: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo 🗄️  Database: PostgreSQL on localhost:5432
echo.
echo 📝 Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop services: docker-compose down
echo   - Restart: docker-compose restart
echo.
echo 🎉 Happy coding!
pause

