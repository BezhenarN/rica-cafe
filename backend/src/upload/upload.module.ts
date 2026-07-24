import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'products');

/** Гарантирует, что папка uploads существует. */
function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function productImageStorage() {
  ensureUploadDir();
  return diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req: any, file: any, cb: any) => {
      const id = Date.now().toString(36);
      const ext = path.extname(file.originalname) || '.jpg';
      const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      cb(null, `${safe}${ext}`);
    },
  });
}

export { UPLOAD_DIR };
