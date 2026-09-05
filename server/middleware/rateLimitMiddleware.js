import rateLimit from 'express-rate-limit';

// Rate limiter for login & registration routes to prevent brute-force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Max 20 auth attempts per IP per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// General API protection rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests created from this IP. Please try again later.'
  }
});
