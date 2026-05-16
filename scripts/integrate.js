#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const distDir = join(rootDir, 'dist');
const v2DistDir = join(rootDir, 'v2', 'dist');

console.log('🔄 Preparing v2 build for deployment...');

if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

if (!existsSync(v2DistDir)) {
    console.error('❌ v2 dist directory not found. Run "npm run build:v2" first.');
    process.exit(1);
}

console.log('📂 Copying v2 to root...');
copyRecursively(v2DistDir, distDir);

const v2CnameFile = join(rootDir, 'v2', 'CNAME');
if (existsSync(v2CnameFile)) {
    console.log('📄 Copying CNAME for custom domain...');
    copyFileSync(v2CnameFile, join(distDir, 'CNAME'));
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
