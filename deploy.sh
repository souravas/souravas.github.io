#!/bin/bash

# Deployment script for integrated souravas.github.io
# This script builds both v1 and v2, integrates them, and deploys to GitHub Pages

echo "🚀 Deploying integrated souravas.github.io to GitHub Pages..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ This directory is not a git repository. Please run 'git init' first."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    git status --short
    exit 1
fi

# Install dependencies for both projects
echo "📦 Installing dependencies..."
cd v1 && npm install && cd ..
cd v2 && npm install && cd ..
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

# Build the integrated project
echo "🔨 Building integrated project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"

    # Deploy to GitHub Pages
    echo "🌐 Deploying to GitHub Pages..."
    npm run deploy

    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "🔗 Your site should be available at:"
        echo "   Main site (v2): https://souravas.github.io"
        echo "   Version 1: https://souravas.github.io/v1"
        echo "   Version 2: https://souravas.github.io/v2 (redirects to main)"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
