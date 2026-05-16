#!/bin/bash

# Deployment script for souravas.github.io v3
# Builds the v3 site and deploys its dist/ to GitHub Pages.
# Use only after v3 has been promoted to the canonical site
# (i.e. vite base flipped to '/' and CNAME present in v3/).

echo "🚀 Deploying souravas.github.io v3 to GitHub Pages..."

if [ ! -d ".git" ] && [ ! -d "../.git" ]; then
    echo "❌ Not inside a git repository. Run 'git init' first."
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    git status --short
    exit 1
fi

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

echo "🌐 Deploying to GitHub Pages..."
npm run deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "🎉 Deployment successful!"
echo "🔗 Your site should be available at: https://souravas.com"
