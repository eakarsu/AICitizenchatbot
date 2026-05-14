const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../logger');

// Ensure the citizen_feedback table exists (idempotent)
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS citizen_feedback (
        id SERIAL PRIMARY KEY,
        conversation_id UUID,
        user_id INTEGER,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    logger.error('Failed to create citizen_feedback table', { error: err.message });
  }
})();

// ─── POST /api/chatbot/feedback ───────────────────────────────────────────────
router.post(
  '/',
  authenticateToken,
  [
    body('conversation_id')
      .optional()
      .isUUID().withMessage('conversation_id must be a valid UUID'),
    body('rating')
      .notEmpty().withMessage('rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('rating must be an integer between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .isLength({ max: 1000 }).withMessage('comment must not exceed 1000 characters')
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { conversation_id, rating, comment } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO citizen_feedback (conversation_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [conversation_id || null, req.user.id, rating, comment || null]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      logger.error('Failed to save feedback', { error: err.message });
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
