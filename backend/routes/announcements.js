const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority, author, expiry_date, status } = req.body;
    const result = await pool.query(
      'INSERT INTO announcements (title, description, category, priority, author, publish_date, expiry_date, status) VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7) RETURNING *',
      [title, description, category, priority || 'normal', author, expiry_date, status || 'active']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority, author, expiry_date, status } = req.body;
    const result = await pool.query(
      'UPDATE announcements SET title=$1, description=$2, category=$3, priority=$4, author=$5, expiry_date=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, category, priority, author, expiry_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
