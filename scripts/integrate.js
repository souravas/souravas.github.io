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

// Copy v2 (main site) to root of dist
if (existsSync(v2DistDir)) {
    console.log('📂 Copying v2 to root...');
    copyRecursively(v2DistDir, distDir);
    
    // Ensure CNAME file is copied to root for custom domain
    const v2CnameFile = join(rootDir, 'v2', 'CNAME');
    if (existsSync(v2CnameFile)) {
        console.log('📄 Copying CNAME for custom domain...');
        copyFileSync(v2CnameFile, join(distDir, 'CNAME'));
    }
} else {
    console.error('❌ v2 dist directory not found. Run "npm run build:v2" first.');
    process.exit(1);
}

// Copy v1 to /v1 subdirectory
if (existsSync(v1DistDir)) {
    console.log('📂 Copying v1 to /v1...');
    const v1Target = join(distDir, 'v1');
    mkdirSync(v1Target, { recursive: true });
    copyRecursively(v1DistDir, v1Target);
} else {
    console.error('❌ v1 dist directory not found. Run "npm run build:v1" first.');
    process.exit(1);
}

// Create a simple redirect index for /v2 (redirect to root)
const v2IndexContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
        // Redirect /v2 to root (since v2 is now the main site)
        window.location.replace('/');
    </script>
</head>
<body>
    <p>Redirecting to main site...</p>
    <a href="/">Click here if not redirected automatically</a>
</body>
</html>`;

const v2Dir = join(distDir, 'v2');
mkdirSync(v2Dir, { recursive: true });
writeFileSync(join(v2Dir, 'index.html'), v2IndexContent);

console.log('✅ Integration complete!');
console.log('📁 Structure:');
console.log('   / → v2 (main site)');
console.log('   /v1 → v1 site');
console.log('   /v2 → redirects to /');

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
