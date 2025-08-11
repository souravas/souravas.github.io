#!/bin/bash

# Build optimization script for souravas.github.io v2
# This script builds the project and optimizes assets

echo "🚀 Building and optimizing souravas.github.io v2..."

# Clean and build
echo "📦 Building with Vite..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📊 Analyzing bundle size..."
    npm run analyze
    echo "🎉 Optimization complete! Check the 'dist' folder for the optimized build."
else
    echo "❌ Build failed!"
    exit 1
fi
