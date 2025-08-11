#!/bin/bash

echo "🔍 Service Worker Debug Information"
echo "=================================="
echo ""

# Check if service worker file exists
if [ -f "public/sw.js" ]; then
    echo "✅ Service worker file exists: public/sw.js"
    echo "📄 File size: $(du -h public/sw.js | cut -f1)"
else
    echo "❌ Service worker file NOT found: public/sw.js"
fi

echo ""

# Check if it's included in the build
if [ -f "dist/sw.js" ]; then
    echo "✅ Service worker included in build: dist/sw.js"
    echo "📄 Build file size: $(du -h dist/sw.js | cut -f1)"
else
    echo "❌ Service worker NOT found in build directory"
    echo "💡 Run 'npm run build' first"
fi

echo ""
echo "🌐 To check if Service Worker is running:"
echo "1. Open https://souravas.com/ in browser"
echo "2. Press F12 → Application tab → Service Workers"
echo "3. Or check browser console for registration messages"
echo ""
echo "🔧 Alternative browser checks:"
echo "Chrome:  chrome://serviceworker-internals/"
echo "Firefox: about:serviceworkers"
echo "Edge:    edge://serviceworker-internals/"
