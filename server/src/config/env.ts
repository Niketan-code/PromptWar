import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
  OVERPASS_URL: z.string().default('https://overpass-api.de/api/interpreter'),
  OSRM_URL: z.string().default('https://router.project-osrm.org'),
  NOMINATIM_URL: z.string().default('https://nominatim.openstreetmap.org'),
  UPLOAD_MAX_MB: z.string().default('5').transform(Number),
  RATE_LIMIT_PER_MIN: z.string().default('120').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
