const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, search, status, category, department } = req.query;
    const term = q || search;
    const cond = []; const vals = []; let i = 1;
    if (term) { cond.push(`(name ILIKE $${i} OR description ILIKE $${i} OR category ILIKE $${i} OR department ILIKE $${i})`); vals.push(`%${term}%`); i++; }
    if (status) { cond.push(`status = $${i++}`); vals.push(status); }
    if (category) { cond.push(`category ILIKE $${i++}`); vals.push(`%${category}%`); }
    if (department) { cond.push(`department ILIKE $${i++}`); vals.push(`%${department}%`); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const result = await pool.query(`SELECT * FROM services ${where} ORDER BY name ASC`, vals);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, department, category, eligibility, fee, processing_time, status, contact_info } = req.body;
    const result = await pool.query(
      'INSERT INTO services (name, description, department, category, eligibility, fee, processing_time, status, contact_info) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, description, department, category, eligibility, fee, processing_time, status || 'active', contact_info]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, department, category, eligibility, fee, processing_time, status, contact_info } = req.body;
    const result = await pool.query(
      'UPDATE services SET name=$1, description=$2, department=$3, category=$4, eligibility=$5, fee=$6, processing_time=$7, status=$8, contact_info=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [name, description, department, category, eligibility, fee, processing_time, status, contact_info, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
