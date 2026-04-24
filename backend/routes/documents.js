const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, file_type, department, status, author } = req.body;
    const result = await pool.query(
      'INSERT INTO documents (title, description, category, file_type, department, status, author, publish_date) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
      [title, description, category, file_type || 'PDF', department, status || 'active', author]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, file_type, department, status, author } = req.body;
    const result = await pool.query(
      'UPDATE documents SET title=$1, description=$2, category=$3, file_type=$4, department=$5, status=$6, author=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, category, file_type, department, status, author, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
