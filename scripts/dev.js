#!/usr/bin/env node

import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

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
