const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../logger');

// ─── GET /api/analytics/satisfaction ─────────────────────────────────────────
// Returns avg rating, rating distribution, and recent comments
router.get('/satisfaction', authenticateToken, async (req, res) => {
  try {
    const avgResult = await pool.query(
      `SELECT
         ROUND(AVG(rating)::numeric, 2) AS avg_rating,
         COUNT(*) AS total_feedback,
         COUNT(CASE WHEN rating >= 4 THEN 1 END) AS positive_count,
         COUNT(CASE WHEN rating <= 2 THEN 1 END) AS negative_count
       FROM citizen_feedback`
    );

    const distributionResult = await pool.query(
      `SELECT rating, COUNT(*) AS count
       FROM citizen_feedback
       GROUP BY rating
       ORDER BY rating`
    );

    const recentComments = await pool.query(
      `SELECT rating, comment, created_at
       FROM citizen_feedback
       WHERE comment IS NOT NULL AND comment != ''
       ORDER BY created_at DESC
       LIMIT 20`
    );

    const stats = avgResult.rows[0];
    const total = parseInt(stats.total_feedback) || 0;
    const positive = parseInt(stats.positive_count) || 0;
    const resolution_rate = total > 0 ? Math.round((positive / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        avg_rating: parseFloat(stats.avg_rating) || 0,
        total_feedback: total,
        positive_count: positive,
        negative_count: parseInt(stats.negative_count) || 0,
        resolution_rate_percent: resolution_rate,
        rating_distribution: distributionResult.rows,
        recent_comments: recentComments.rows,
      }
    });
  } catch (err) {
    logger.error('Failed to fetch satisfaction analytics', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
