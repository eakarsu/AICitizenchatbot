/*
 * Custom Views — Citizen Views (gov citizen services chatbot)
 * 4 endpoints (no DB dependency, in-memory rule store):
 *   GET  /api/custom-views/topic-distribution       (VIZ)   query topic distribution
 *   GET  /api/custom-views/department-heatmap       (VIZ)   department routing heatmap (topic x dept)
 *   POST /api/custom-views/response-letter-pdf      (N-VIZ) generate citizen response letter PDF
 *   GET  /api/custom-views/routing-rules            (N-VIZ) read routing rules
 *   POST /api/custom-views/routing-rules            (N-VIZ) create / update routing rule
 *   DELETE /api/custom-views/routing-rules/:id      (N-VIZ) delete routing rule
 */
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// ---------- in-memory routing-rule store (persisted per-process) ----------
const ROUTING_RULES = [
  { id: 'r-pothole',    intent: 'report_pothole',  keywords: ['pothole', 'road damage', 'street hole'],         department: 'Public Works',     priority: 1 },
  { id: 'r-water-bill', intent: 'pay_bill',        keywords: ['water bill', 'utility payment', 'pay bill'],     department: 'Utilities',        priority: 1 },
  { id: 'r-permit',     intent: 'permit_apply',    keywords: ['building permit', 'apply permit', 'zoning'],     department: 'Permits & Zoning', priority: 2 },
  { id: 'r-trash',      intent: 'trash_schedule',  keywords: ['trash', 'garbage', 'recycling'],                 department: 'Sanitation',       priority: 3 },
  { id: 'r-parks',      intent: 'park_hours',      keywords: ['park hours', 'park open', 'park close'],         department: 'Parks & Rec',      priority: 3 },
  { id: 'r-tax',        intent: 'pay_bill',        keywords: ['property tax', 'tax bill', 'tax online'],        department: 'Tax Assessor',     priority: 1 },
  { id: 'r-vote',       intent: 'voter_info',      keywords: ['register vote', 'voter id', 'polling place'],    department: 'Clerk of Elections', priority: 2 },
];

const TOPICS = ['Permits', 'Utilities', 'Public Safety', 'Parks', 'Taxes', 'Transit', 'Sanitation'];
const DEPARTMENTS = ['Public Works', 'Utilities', 'Permits & Zoning', 'Sanitation', 'Parks & Rec', 'Tax Assessor', 'Clerk of Elections'];

// ---------- 1. VIZ: query topic distribution ----------
router.get('/topic-distribution', (req, res) => {
  // deterministic synthetic distribution of chatbot queries by topic
  const distribution = TOPICS.map((topic, i) => {
    const base = 120 + ((i * 47) % 180);
    const burst = ((i + 3) * 19) % 60;
    return { topic, count: base + burst };
  });
  const total = distribution.reduce((s, d) => s + d.count, 0);
  distribution.forEach((d) => (d.percent = Math.round((d.count / total) * 1000) / 10));
  distribution.sort((a, b) => b.count - a.count);
  res.json({
    success: true,
    data: {
      distribution,
      total_queries: total,
      top_topic: distribution[0].topic,
      generated_at: new Date().toISOString(),
    },
  });
});

// ---------- 2. VIZ: department routing heatmap (topic x dept) ----------
router.get('/department-heatmap', (req, res) => {
  const matrix = TOPICS.map((t, ti) =>
    DEPARTMENTS.map((d, di) => {
      // affinity: same-name pair gets boost, otherwise deterministic noise
      const affinity = (t.toLowerCase().includes(d.split(' ')[0].toLowerCase()) ||
                        d.toLowerCase().includes(t.toLowerCase())) ? 40 : 0;
      const base = 3 + ((ti * 11 + di * 7) % 14);
      const noise = ((ti + 1) * (di + 2)) % 9;
      return base + noise + affinity;
    })
  );
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  res.json({
    success: true,
    data: {
      topics: TOPICS,
      departments: DEPARTMENTS,
      matrix,
      total_routings: total,
      generated_at: new Date().toISOString(),
    },
  });
});

// ---------- 3. NON-VIZ: citizen response letter PDF ----------
router.post('/response-letter-pdf', (req, res) => {
  const {
    citizen_name = 'Valued Citizen',
    case_id = `CASE-${Date.now().toString().slice(-6)}`,
    subject = 'Your Service Request',
    department = 'County Citizen Services',
    body,
    officer = 'Citizen Services Officer',
  } = req.body || {};

  const letterBody = body ||
    `Thank you for contacting the County. We have received your inquiry regarding "${subject}". ` +
    `Your case has been assigned reference number ${case_id} and routed to the ${department} ` +
    `department for review. A representative will follow up within 3 business days. ` +
    `For status updates, please reference your case number when contacting us.`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="response-letter-${case_id}.pdf"`);
  const doc = new PDFDocument({ size: 'LETTER', margin: 64 });
  doc.pipe(res);

  // header
  doc.fontSize(18).fillColor('#1f2937').text('County Government', { align: 'left' });
  doc.fontSize(11).fillColor('#6b7280').text(department, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#9ca3af').text(`Issued: ${new Date().toLocaleDateString()}  |  Case ID: ${case_id}`);
  doc.moveTo(64, doc.y + 6).lineTo(548, doc.y + 6).strokeColor('#e5e7eb').stroke();
  doc.moveDown(1.2);

  // greeting
  doc.fontSize(12).fillColor('#111827').text(`Dear ${citizen_name},`);
  doc.moveDown(0.6);

  // subject
  doc.fontSize(12).fillColor('#111827').text(`Re: ${subject}`, { underline: true });
  doc.moveDown(0.6);

  // body
  doc.fontSize(11).fillColor('#374151').text(letterBody, { align: 'justify', lineGap: 3 });
  doc.moveDown(1.2);

  // sign-off
  doc.fontSize(11).fillColor('#111827').text('Sincerely,');
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor('#111827').text(officer);
  doc.fontSize(10).fillColor('#6b7280').text(department);

  doc.end();
});

// ---------- 4. NON-VIZ: intent routing rules editor (CRUD) ----------
router.get('/routing-rules', (req, res) => {
  res.json({
    success: true,
    data: { rules: ROUTING_RULES, count: ROUTING_RULES.length, departments: DEPARTMENTS },
  });
});

router.post('/routing-rules', (req, res) => {
  const { id, intent, keywords, department, priority } = req.body || {};
  if (!intent || !department) {
    return res.status(400).json({ success: false, error: 'intent and department are required' });
  }
  const ruleId = id || `r-${intent}-${Date.now().toString().slice(-5)}`;
  const next = {
    id: String(ruleId),
    intent: String(intent),
    keywords: Array.isArray(keywords) ? keywords : String(keywords || '').split(',').map((s) => s.trim()).filter(Boolean),
    department: String(department),
    priority: Number(priority) || 5,
  };
  const idx = ROUTING_RULES.findIndex((r) => r.id === next.id);
  if (idx >= 0) ROUTING_RULES[idx] = next; else ROUTING_RULES.push(next);
  res.json({ success: true, data: { rule: next, count: ROUTING_RULES.length } });
});

router.delete('/routing-rules/:id', (req, res) => {
  const idx = ROUTING_RULES.findIndex((r) => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ success: false, error: 'not found' });
  const [removed] = ROUTING_RULES.splice(idx, 1);
  res.json({ success: true, data: { removed, count: ROUTING_RULES.length } });
});

router.get('/health', (req, res) =>
  res.json({ success: true, feature: 'custom_views', endpoints: 4 })
);

module.exports = router;
