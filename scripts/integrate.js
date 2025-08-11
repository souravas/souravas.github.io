#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, rmSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const distDir = join(rootDir, 'dist');
const v1DistDir = join(rootDir, 'v1', 'dist');
const v2DistDir = join(rootDir, 'v2', 'dist');

console.log('🔄 Integrating v1 and v2 builds...');

// Clean and create dist directory
if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

// Copy v1 (main site) to root of dist
if (existsSync(v1DistDir)) {
    console.log('📂 Copying v1 to root...');
    copyRecursively(v1DistDir, distDir);
} else {
    console.error('❌ v1 dist directory not found. Run "npm run build:v1" first.');
    process.exit(1);
}

// Copy v2 to /v2 subdirectory
if (existsSync(v2DistDir)) {
    console.log('📂 Copying v2 to /v2...');
    const v2Target = join(distDir, 'v2');
    mkdirSync(v2Target, { recursive: true });
    copyRecursively(v2DistDir, v2Target);
} else {
    console.error('❌ v2 dist directory not found. Run "npm run build:v2" first.');
    process.exit(1);
}

// Create a simple redirect index for /v1
const v1IndexContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
        // Redirect /v1 to root
        window.location.replace('/');
    </script>
</head>
<body>
    <p>Redirecting to main site...</p>
    <a href="/">Click here if not redirected automatically</a>
</body>
</html>`;

const v1Dir = join(distDir, 'v1');
mkdirSync(v1Dir, { recursive: true });
writeFileSync(join(v1Dir, 'index.html'), v1IndexContent);

console.log('✅ Integration complete!');
console.log('📁 Structure:');
console.log('   / → v1 (main site)');
console.log('   /v1 → redirects to /');
console.log('   /v2 → v2 site');

function copyRecursively(src, dest) {
    const stat = statSync(src);
    
    if (stat.isDirectory()) {
        if (!existsSync(dest)) {
            mkdirSync(dest, { recursive: true });
        }
        
        const items = readdirSync(src);
        for (const item of items) {
            copyRecursively(join(src, item), join(dest, item));
        }
    } else {
        copyFileSync(src, dest);
    }
}
