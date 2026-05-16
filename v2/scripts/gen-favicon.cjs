#!/usr/bin/env node
// Regenerates all favicon raster assets from public/favicon.svg.
// Outputs into public/ — re-run after editing the SVG.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;

const publicDir = path.resolve(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');
const svg = fs.readFileSync(svgPath);

const pngTargets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

async function main() {
  for (const { name, size } of pngTargets) {
    const out = path.join(publicDir, name);
    await sharp(svg, { density: Math.max(384, size * 6) })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`wrote ${name} (${size}x${size})`);
  }

  // ICO bundles 16/32/48
  const icoBufs = await Promise.all(
    [16, 32, 48].map(s =>
      sharp(svg, { density: Math.max(384, s * 6) }).resize(s, s).png().toBuffer()
    )
  );
  const ico = await pngToIco(icoBufs);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
  console.log('wrote favicon.ico');
}

main().catch(e => { console.error(e); process.exit(1); });
