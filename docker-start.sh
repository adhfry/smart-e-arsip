#!/bin/bash
# Script untuk memulai aplikasi dengan Docker
# Usage: ./docker-start.sh [production|development]

set -e

MODE=${1:-production}

echo "🚀 Starting Smart E-Arsip API in $MODE mode..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ "$MODE" = "production" ]; then
        cp .env.docker .env
    else
        cp .env.example .env
    fi
    echo "✅ .env file created. Please edit it with your configuration."
    echo "   IMPORTANT: Change all passwords and secrets!"
    exit 1
fi

# Start services based on mode
if [ "$MODE" = "development" ] || [ "$MODE" = "dev" ]; then
    echo "🔧 Starting in development mode with hot reload..."
    docker-compose -f docker-compose.dev.yml up -d
    echo ""
    echo "✅ Development environment started!"
    echo "   - API: http://localhost:3000"
    echo "   - MySQL: localhost:3306"
    echo "   - Redis: localhost:6379"
    echo "   - Debug port: 9229"
    echo ""
    echo "View logs: docker-compose -f docker-compose.dev.yml logs -f api"
else
    echo "🏭 Starting in production mode..."
    docker-compose up -d
    echo ""
    echo "✅ Production environment started!"
    echo "   - API: http://localhost:3000"
    echo ""
    echo "View logs: docker-compose logs -f api"
fi

echo ""
echo "📊 Container status:"
if [ "$MODE" = "development" ] || [ "$MODE" = "dev" ]; then
    docker-compose -f docker-compose.dev.yml ps
else
    docker-compose ps
fi

echo ""
echo "🔍 Waiting for services to be healthy..."
sleep 5

# Test API
echo ""
echo "🧪 Testing API connection..."
if curl -s http://localhost:3000/api > /dev/null; then
    echo "✅ API is responding!"
else
    echo "⚠️  API is not responding yet. Check logs for details."
fi

echo ""
echo "📚 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop: docker-compose down"
echo "   - Restart: docker-compose restart api"
echo "   - Database migration: docker-compose exec api npx prisma migrate deploy"
echo "   - Database GUI: docker-compose exec api npx prisma studio"
