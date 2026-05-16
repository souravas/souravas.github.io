#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const distDir = join(rootDir, 'dist');
const v3DistDir = join(rootDir, 'v3', 'dist');

console.log('🔄 Preparing build for deployment...');

if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

if (!existsSync(v3DistDir)) {
    console.error('❌ v3 dist directory not found. Run "npm run build:v3" first.');
    process.exit(1);
}

console.log('📂 Copying v3 → dist...');
copyRecursively(v3DistDir, distDir);

const cnameFile = join(rootDir, 'v3', 'CNAME');
if (existsSync(cnameFile)) {
    console.log('📄 Copying CNAME for custom domain...');
    copyFileSync(cnameFile, join(distDir, 'CNAME'));
}

console.log('✅ Integration complete!');

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
