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

/* ── Prisma client for standalone (API routes) ────────────────────────── */

const prismaSrc = path.join(__dirname, 'node_modules', '@prisma', 'client');
const prismaDst = path.join(__dirname, '.next', 'standalone', 'node_modules', '@prisma', 'client');
if (fs.existsSync(prismaSrc)) {
  console.log('[postbuild] Copying @prisma/client to standalone...');
  if (!fs.existsSync(path.dirname(prismaDst))) {
    fs.mkdirSync(path.dirname(prismaDst), { recursive: true });
  }
  copyDirSync(prismaSrc, prismaDst);
}

// Copy .prisma client
const prismaClientSrc = path.join(__dirname, 'node_modules', '.prisma', 'client');
const prismaClientDst = path.join(__dirname, '.next', 'standalone', 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientSrc)) {
  console.log('[postbuild] Copying .prisma/client to standalone...');
  if (!fs.existsSync(path.dirname(prismaClientDst))) {
    fs.mkdirSync(path.dirname(prismaClientDst), { recursive: true });
  }
  copyDirSync(prismaClientSrc, prismaClientDst);
}

// Create .prisma symlink inside @prisma/client so require('.prisma/client/default') resolves.
// @prisma/client/index.js does: ...require('.prisma/client/default')
// The relative path resolves from @prisma/client/.prisma -> ../../../.prisma (node_modules/.prisma)
const clientPrismaSymlink = path.join(prismaDst, '.prisma');
if (!fs.existsSync(clientPrismaSymlink)) {
  try { fs.symlinkSync('../../../.prisma', clientPrismaSymlink, 'junction'); }
  catch { /* may already exist */ }
  console.log('[postbuild] Created symlink @prisma/client/.prisma -> ../../../.prisma');
}

// Also create .prisma symlink inside node_modules/.prisma so .prisma/client resolves there
const prismaRoot = path.dirname(prismaDst);
const prismaSelfSymlink = path.join(prismaRoot, '.prisma', '.prisma');
if (!fs.existsSync(prismaSelfSymlink)) {
  try { fs.symlinkSync('../.prisma', prismaSelfSymlink, 'junction'); }
  catch { /* may already exist */ }
  console.log('[postbuild] Created symlink node_modules/.prisma/.prisma -> ../.prisma');
}

// Create hash-sufficed Prisma symlink (e.g. client-2c3a283f134fdcb6).
// Next.js resolves Prisma via dynamic require("@prisma/client-<hash>"), which
// standalone build copies as a path reference but never creates the symlink.
// We extract the expected hash from .nft.json files produced by Next.js.
function findPrismaHashes(nextDir) {
  const hashes = new Set();
  const candidateDirs = ['server', '.standalone/.next/server', '.standalone/server'];
  for (const sub of candidateDirs) {
    const dir = path.join(nextDir, sub);
    if (!fs.existsSync(dir)) continue;
    walkFiles(dir, (f) => {
      if (!f.endsWith('.js.nft.json')) return;
      try {
        const content = fs.readFileSync(f, 'utf8');
        const meta = JSON.parse(content);
        const files = meta.files || [];
        for (const ref of files) {
          const m = ref.match(/@prisma\/client-([a-f0-9]+)/);
          if (m) hashes.add(m[1]);
        }
      } catch { /* skip corrupt JSON */ }
    });
  }
  return hashes;
}

function walkFiles(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkFiles(full, cb); }
    else { cb(full); }
  }
}

const prismaHashes = findPrismaHashes(path.join(__dirname, '.next'));
if (prismaHashes.size > 0) {
  const prismaHashDir = path.join(__dirname, '.next', 'standalone', 'node_modules', '@prisma');
  if (!fs.existsSync(prismaHashDir)) fs.mkdirSync(prismaHashDir, { recursive: true });
  // Use relative symlink "client" so it works on any machine/server
  for (const hash of prismaHashes) {
    const linkName = path.join(prismaHashDir, `client-${hash}`);
    if (!fs.existsSync(linkName)) {
      fs.symlinkSync('client', linkName, 'junction');
      console.log(`[postbuild] Created symlink client-${hash} -> client (relative)`);
    }
  }
} else {
  console.log('[postbuild] No Prisma hash found in .nft.json (Prisma API routes may need manual symlink)');
}

console.log('[postbuild] Done.');
