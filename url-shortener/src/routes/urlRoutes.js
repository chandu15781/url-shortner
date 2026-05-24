const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  shortenUrl,
  getStats,
  listUrls,
  deleteUrl,
  toggleUrl,
} = require('../controllers/urlController');

// Rate limiter for shorten endpoint
const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
router.post('/shorten', shortenLimiter, shortenUrl);
router.get('/stats/:shortCode', getStats);
router.get('/urls', listUrls);
router.delete('/urls/:shortCode', deleteUrl);
router.patch('/urls/:shortCode/toggle', toggleUrl);

module.exports = router;
