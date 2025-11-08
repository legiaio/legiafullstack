#!/bin/bash

# Legia Deployment Script
echo "🚀 Starting Legia deployment..."

# Check if environment variables are set
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  Warning: NEXTAUTH_SECRET not set. Generating a random secret..."
    export NEXTAUTH_SECRET=$(openssl rand -base64 32)
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma db push

# Build the application
echo "🏗️  Building application..."
npm run build

# Start the application
echo "✅ Starting Legia application..."
npm start