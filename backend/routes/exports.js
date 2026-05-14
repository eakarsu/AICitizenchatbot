/**
 * Exports & reports (audit gap: missing reporting).
 *   GET /api/exports/summary             - resource counts
 *   GET /api/exports/services.csv        - CSV of services
 *   GET /api/exports/permits.csv
 *   GET /api/exports/announcements.csv
 *   GET /api/exports/feedback.csv
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

async function safeCount(table) {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
    return r.rows[0].c;
  } catch (_) { return 0; }
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

async function tableToCsv(res, table, filename) {
  let rows = [];
  try {
    const r = await pool.query(`SELECT * FROM ${table} ORDER BY 1 DESC LIMIT 5000`);
    rows = r.rows;
  } catch (_) { rows = []; }
  const headers = rows.length ? Object.keys(rows[0]) : ['id'];
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map(h => csvCell(row[h])).join(','));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(lines.join('\n'));
}

router.get('/summary', async (req, res) => {
  try {
    const [services, permits, announcements, events, faqs, feedback, documents] = await Promise.all([
      safeCount('services'), safeCount('permits'), safeCount('announcements'),
      safeCount('events'), safeCount('faqs'), safeCount('feedback'), safeCount('documents')
    ]);
    res.json({ services, permits, announcements, events, faqs, feedback, documents });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/services.csv', (req, res) => tableToCsv(res, 'services', 'services.csv'));
router.get('/permits.csv', (req, res) => tableToCsv(res, 'permits', 'permits.csv'));
router.get('/announcements.csv', (req, res) => tableToCsv(res, 'announcements', 'announcements.csv'));
router.get('/feedback.csv', (req, res) => tableToCsv(res, 'feedback', 'feedback.csv'));

module.exports = router;
