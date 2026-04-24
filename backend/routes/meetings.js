const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meetings ORDER BY meeting_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meetings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, meeting_type, location, meeting_date, start_time, end_time, attendees, status, minutes_url } = req.body;
    const result = await pool.query(
      'INSERT INTO meetings (title, description, meeting_type, location, meeting_date, start_time, end_time, attendees, status, minutes_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, description, meeting_type, location, meeting_date, start_time, end_time, attendees, status || 'scheduled', minutes_url]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, meeting_type, location, meeting_date, start_time, end_time, attendees, status, minutes_url } = req.body;
    const result = await pool.query(
      'UPDATE meetings SET title=$1, description=$2, meeting_type=$3, location=$4, meeting_date=$5, start_time=$6, end_time=$7, attendees=$8, status=$9, minutes_url=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [title, description, meeting_type, location, meeting_date, start_time, end_time, attendees, status, minutes_url, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM meetings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
