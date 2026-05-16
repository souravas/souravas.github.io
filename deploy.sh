#!/bin/bash

# Deployment script for souravas.github.io
# Builds v2 and deploys to GitHub Pages

echo "🚀 Deploying souravas.github.io to GitHub Pages..."

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

# Install dependencies
echo "📦 Installing dependencies..."
cd v2 && npm install && cd ..
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"

    # Deploy to GitHub Pages
    echo "🌐 Deploying to GitHub Pages..."
    npm run deploy

    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "🔗 Your site should be available at: https://souravas.github.io"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
