const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, title, department, email, phone, office_location, office_hours, bio, status } = req.body;
    const result = await pool.query(
      'INSERT INTO contacts (name, title, department, email, phone, office_location, office_hours, bio, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, title, department, email, phone, office_location, office_hours, bio, status || 'active']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, title, department, email, phone, office_location, office_hours, bio, status } = req.body;
    const result = await pool.query(
      'UPDATE contacts SET name=$1, title=$2, department=$3, email=$4, phone=$5, office_location=$6, office_hours=$7, bio=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [name, title, department, email, phone, office_location, office_hours, bio, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
