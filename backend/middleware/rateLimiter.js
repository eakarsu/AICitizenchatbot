const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// 30 chat messages per hour per IP — no auth required for citizens
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Citizens are limited to 30 chat messages per hour. Please try again later.'
  },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

module.exports = { chatLimiter };
