#!/bin/bash

echo "🚀 Digni Ride Backend - Quick Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and configure DATABASE_URL before proceeding"
    echo ""
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗃️  Running database migrations..."
read -p "Have you configured DATABASE_URL in .env? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm run prisma:migrate
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "To start the server, run:"
    echo "  npm run dev"
    echo ""
    echo "Server will be available at: http://localhost:3000"
    echo "Health check: http://localhost:3000/health"
    echo "API docs: See API_DOCS.md"
else
    echo ""
    echo "⚠️  Please configure DATABASE_URL in .env and then run:"
    echo "  npm run prisma:migrate"
    echo "  npm run dev"
fi
