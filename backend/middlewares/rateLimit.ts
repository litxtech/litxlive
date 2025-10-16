import type { Context, Next } from 'hono';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const CLEANUP_INTERVAL = 60000;
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, CLEANUP_INTERVAL);

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,
    maxRequests = 60,
    keyGenerator = (c: Context) => {
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
      return ip;
    },
    skipSuccessfulRequests = false,
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    store[key].count++;

    const remaining = Math.max(0, maxRequests - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetTime.toString());

    if (store[key].count > maxRequests) {
      console.warn(`[RateLimit] Blocked request from ${key}: ${store[key].count}/${maxRequests}`);
      return c.json(
        {
          success: false,
          message: 'Too many requests, please try again later',
          retryAfter: resetTime,
        },
        429
      );
    }

    await next();

    if (skipSuccessfulRequests && c.res.status < 400) {
      store[key].count--;
    }
  };
}

export const strictRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 5,
});

export const authRateLimit = rateLimit({
  windowMs: 900000,
  maxRequests: 5,
  keyGenerator: (c: Context) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    return `auth:${ip}`;
  },
});

export const apiRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 100,
});
