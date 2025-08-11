#!/bin/bash

# Portfolio Site Optimization Script
echo "🚀 Starting portfolio optimization..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build the optimized version
echo "🏗️  Building optimized version..."
npm run build

# Check build sizes
echo "📊 Build analysis:"
echo "----------------------------------------"
ls -lh dist/assets/ 2>/dev/null || echo "No assets directory found"
echo "----------------------------------------"

# Display total dist size
DIST_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1)
echo "Total dist size: $DIST_SIZE"

echo "✅ Optimization complete!"
echo ""
echo "Key optimizations applied:"
echo "• Terser minification for JS"
echo "• CSS optimization with cssnano"
echo "• Service Worker for caching"
echo "• Enhanced cache headers"
echo "• DNS prefetching for external domains"
echo "• Improved PWA manifest"
echo "• Resource hints for better loading"
echo ""
echo "Run 'npm run preview' to test the optimized build locally"
