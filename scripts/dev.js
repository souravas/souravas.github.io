#!/usr/bin/env node

import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const mode = process.argv[2] || 'v1';

if (mode === 'v1') {
    console.log('🚀 Starting v1 development server...');
    const server = await createServer({
        root: join(rootDir, 'v1'),
        server: {
            port: 3000,
            open: true
        }
    });
    await server.listen();
    server.printUrls();
} else if (mode === 'v2') {
    console.log('🚀 Starting v2 development server...');
    const server = await createServer({
        root: join(rootDir, 'v2'),
        server: {
            port: 3001,
            open: true
        }
    });
    await server.listen();
    server.printUrls();
} else {
    console.log('Usage: node scripts/dev.js [v1|v2]');
    process.exit(1);
}
