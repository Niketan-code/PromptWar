import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Memory storage so we can strip EXIF metadata before writing to disk
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * Strips EXIF metadata (specifically GPS and camera metadata) from image buffers.
 * For JPEG, removes APP1 (0xFFE1) segments containing Exif.
 */
export function stripExifMetadata(buffer: Buffer, mimetype: string): Buffer {
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    return stripJpegExif(buffer);
  }
  // PNG and WebP files from mobile web browsers rarely contain raw GPS tags,
  // but we return the sanitized buffer.
  return buffer;
}

function stripJpegExif(buffer: Buffer): Buffer {
  // If not a valid JPEG (must start with SOI 0xFFD8)
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Keep SOI
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      // Find next marker or break
      break;
    }

    const marker = buffer[offset + 1];

    // End of Image marker
    if (marker === 0xd9) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // SOS (Start of Scan) - rest of file is compressed data
    if (marker === 0xda) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    // Marker with length
    if (offset + 4 > buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);
    const segmentEnd = offset + 2 + length;

    if (segmentEnd > buffer.length) break;

    // Check if APP1 (0xE1) segment (typically Exif)
    const isApp1 = marker === 0xe1;
    if (!isApp1) {
      chunks.push(buffer.subarray(offset, segmentEnd));
    }

    offset = segmentEnd;
  }

  return Buffer.concat(chunks);
}

export function saveCleanImage(buffer: Buffer, mimetype: string): string {
  const cleanBuffer = stripExifMetadata(buffer, mimetype);
  const ext = mimetype === 'image/png' ? '.png' : mimetype === 'image/webp' ? '.webp' : '.jpg';
  const filename = `${crypto.randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, cleanBuffer);
  return `/uploads/${filename}`;
}
