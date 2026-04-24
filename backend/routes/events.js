const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, event_type, location, event_date, start_time, end_time, organizer, capacity, registration_required, status } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, description, event_type, location, event_date, start_time, end_time, organizer, capacity, registration_required, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, description, event_type, location, event_date, start_time, end_time, organizer, capacity, registration_required || false, status || 'upcoming']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, event_type, location, event_date, start_time, end_time, organizer, capacity, registration_required, status } = req.body;
    const result = await pool.query(
      'UPDATE events SET title=$1, description=$2, event_type=$3, location=$4, event_date=$5, start_time=$6, end_time=$7, organizer=$8, capacity=$9, registration_required=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [title, description, event_type, location, event_date, start_time, end_time, organizer, capacity, registration_required, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
