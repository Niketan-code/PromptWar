import rateLimit from 'express-rate-limit';

export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // Limit each IP to 180 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    meta: { source: 'real', cached: false },
    error: 'Too many requests, please slow down.',
  },
});

export const reportSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // Stricter limit on citizen report creation
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    meta: { source: 'real', cached: false },
    error: 'Report submission rate limit reached. Please wait a moment.',
  },
});
