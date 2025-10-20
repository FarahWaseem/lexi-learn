#!/bin/bash

# LexiLearn Backend Development Startup Script

echo "🚀 Starting LexiLearn Backend Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is accessible
echo "🔍 Checking database connection..."
npm run migrate

echo "✅ Development environment is ready!"
echo "📊 API Server: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/health"
echo "🗄️  Database: PostgreSQL on localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo "🎉 Happy coding!"

