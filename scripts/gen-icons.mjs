import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import { Buffer } from 'buffer';

const publicDir = new URL('../public/', import.meta.url);

const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="120" fill="#FB923C"/>
  <g transform="translate(256,256)" fill="white">
    <ellipse cx="0" cy="10" rx="110" ry="130" opacity="0.95"/>
    <line x1="0" y1="140" x2="0" y2="-90" stroke="#FB923C" stroke-width="16" stroke-linecap="round"/>
    <line x1="0" y1="30" x2="-65" y2="-30" stroke="#FB923C" stroke-width="12" stroke-linecap="round"/>
    <line x1="0" y1="70" x2="60" y2="15" stroke="#FB923C" stroke-width="12" stroke-linecap="round"/>
    <line x1="0" y1="-10" x2="-55" y2="-65" stroke="#FB923C" stroke-width="12" stroke-linecap="round"/>
    <line x1="0" y1="-50" x2="50" y2="-95" stroke="#FB923C" stroke-width="12" stroke-linecap="round"/>
  </g>
</svg>`;

const svgBuf = Buffer.from(svgStr);

const tasks = [
  sharp(svgBuf).resize(192, 192).png().toFile(new URL('icon-192.png', publicDir).pathname.replace(/^\/([A-Z]:)/, '$1')),
  sharp(svgBuf).resize(512, 512).png().toFile(new URL('icon-512.png', publicDir).pathname.replace(/^\/([A-Z]:)/, '$1')),
  sharp(svgBuf).resize(180, 180).png().toFile(new URL('apple-touch-icon.png', publicDir).pathname.replace(/^\/([A-Z]:)/, '$1')),
  sharp(svgBuf).resize(32, 32).png().toFile(new URL('favicon-32.png', publicDir).pathname.replace(/^\/([A-Z]:)/, '$1')),
];

Promise.all(tasks)
  .then(() => console.log('✅ Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png'))
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
