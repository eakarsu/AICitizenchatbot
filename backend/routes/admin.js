const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../logger');

// Ensure unanswered_questions table exists (idempotent)
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unanswered_questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        question TEXT,
        bot_response TEXT,
        reviewed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    logger.error('Failed to create unanswered_questions table', { error: err.message });
  }
})();

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
// Total chats, avg session length, top 10 questions, unanswered rate
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Total chats
    const totalResult = await pool.query('SELECT COUNT(*) AS total_chats FROM chat_history');
    const total = parseInt(totalResult.rows[0].total_chats) || 0;

    // Unique users / sessions
    const sessionResult = await pool.query(
      `SELECT user_id, COUNT(*) AS msg_count FROM chat_history GROUP BY user_id`
    );
    const avgSessionLength = sessionResult.rows.length > 0
      ? Math.round(sessionResult.rows.reduce((sum, r) => sum + parseInt(r.msg_count), 0) / sessionResult.rows.length)
      : 0;

    // Top 10 messages/questions by frequency
    const topQResult = await pool.query(`
      SELECT message, COUNT(*) AS count
      FROM chat_history
      GROUP BY message
      ORDER BY count DESC
      LIMIT 10
    `);

    // Unanswered rate
    let unansweredCount = 0;
    try {
      const unaResult = await pool.query('SELECT COUNT(*) AS cnt FROM unanswered_questions');
      unansweredCount = parseInt(unaResult.rows[0].cnt) || 0;
    } catch (_) {}

    const unansweredRate = total > 0 ? Math.round((unansweredCount / total) * 100) : 0;

    // Chats per day (last 7 days)
    const dailyResult = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM chat_history
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        total_chats: total,
        avg_session_length: avgSessionLength,
        top_10_questions: topQResult.rows,
        unanswered_count: unansweredCount,
        unanswered_rate_percent: unansweredRate,
        chats_last_7_days: dailyResult.rows,
      }
    });
  } catch (err) {
    logger.error('Failed to fetch admin stats', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/unanswered ─────────────────────────────────────────────────
// Questions the AI said it couldn't answer
router.get('/unanswered', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const reviewed = req.query.reviewed; // 'true' | 'false' | undefined

    let whereClause = '';
    const params = [limit, offset];

    if (reviewed === 'true') {
      whereClause = 'WHERE reviewed = TRUE';
    } else if (reviewed === 'false') {
      whereClause = 'WHERE reviewed = FALSE';
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM unanswered_questions ${whereClause}`
    );
    const total = parseInt(countResult.rows[0].count) || 0;

    const result = await pool.query(
      `SELECT * FROM unanswered_questions ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      }
    });
  } catch (err) {
    logger.error('Failed to fetch unanswered questions', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/admin/unanswered/:id/reviewed ─────────────────────────────────
// Mark a question as reviewed
router.patch('/unanswered/:id/reviewed', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE unanswered_questions SET reviewed = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
