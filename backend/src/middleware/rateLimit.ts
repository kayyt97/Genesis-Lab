import type { NextFunction, Request, Response } from 'express';
import { tooManyRequests } from '../errors.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
};

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      next(tooManyRequests('Too many authentication attempts. Please try again later.'));
      return;
    }

    next();
  };
}

/** Test helper */
export function resetRateLimitBuckets(): void {
  buckets.clear();
}
