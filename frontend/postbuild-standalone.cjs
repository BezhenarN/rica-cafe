// Post-build step: copy .next/static into .next/standalone/.next
// Turbopack in Next.js 16 doesn't include static assets in standalone build
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '.next', 'static');
const dst = path.join(__dirname, '.next', 'standalone', '.next', 'static');

if (!fs.existsSync(src)) {
  console.log('[postbuild] No .next/static found, skipping');
  process.exit(0);
}

function copyDirSync(srcDir, dstDir) {
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('[postbuild] Copying static assets to standalone...');
copyDirSync(src, dst);
console.log('[postbuild] Done. Static assets copied.');
