#!/usr/bin/env node

import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const target = process.argv[2] === 'v3' ? 'v3' : 'v2';
const port = target === 'v3' ? 3003 : 3001;

console.log(`🚀 Starting ${target} development server...`);
const server = await createServer({
    root: join(rootDir, target),
    server: {
        port,
        open: true,
    },
});
await server.listen();
server.printUrls();
