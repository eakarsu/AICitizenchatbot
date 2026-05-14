// Apply pass 4 — mechanical backlog endpoints (permit-eligibility, categorize-feedback)
const express = require('express');
const router = express.Router();
const https = require('https');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const logger = require('../logger');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const FALLBACK_RESPONSE =
  "I'm temporarily unavailable. For immediate assistance, please call your local county department number or visit the county website.";

const SYSTEM_PROMPT =
  "You are a helpful county government assistant. Provide accurate information about local services, permits, and procedures. Always return strict JSON when requested.";

function callOpenRouter(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'County Citizen Chatbot',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse AI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function askAI(messages) {
  const response = await callOpenRouter(messages);
  return response.choices?.[0]?.message?.content || FALLBACK_RESPONSE;
}

function tryParseJson(text) {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (_) {}
  return null;
}

function noKey() {
  const k = process.env.OPENROUTER_API_KEY;
  return !k || k === 'your_openrouter_key_here' || k.trim() === '';
}

// ─── POST /api/ai/permit-eligibility ───────────────────────────────────────
// Given a citizen profile + permit type, return eligibility + missing-document list.
router.post(
  '/permit-eligibility',
  chatLimiter,
  authenticateToken,
  [
    body('permit_type')
      .notEmpty().withMessage('permit_type is required')
      .isString()
      .isLength({ max: 200 }).trim(),
    body('citizen_profile')
      .notEmpty().withMessage('citizen_profile is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    if (noKey()) {
      return res.status(503).json({ success: false, error: 'OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env to enable this endpoint.' });
    }

    const { permit_type, citizen_profile } = req.body;

    // Pull permit info from DB if any
    let permitContext = '';
    try {
      const r = await pool.query(
        "SELECT name, description, fee, processing_time FROM permits WHERE LOWER(name) LIKE $1 LIMIT 5",
        [`%${String(permit_type).toLowerCase()}%`]
      );
      permitContext = r.rows.map(p => `- ${p.name}: ${p.description} | Fee: ${p.fee} | Processing: ${p.processing_time}`).join('\n');
    } catch (_) {}

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Determine eligibility for the following permit and list any missing documents.

Permit type: "${permit_type}"
Citizen profile (JSON):
${JSON.stringify(citizen_profile, null, 2)}

Permits in our database:
${permitContext || 'No matching permits in DB — use general county permit knowledge.'}

Return strict JSON:
{
  "eligible": true|false|"unknown",
  "eligibility_reasons": ["reason 1", "reason 2"],
  "missing_documents": ["doc 1", "doc 2"],
  "supplied_documents": ["doc 1"],
  "next_steps": ["step 1", "step 2"],
  "estimated_fee": "<fee or unknown>",
  "estimated_processing_time": "<time or unknown>",
  "notes": "<caveats>"
}`
      }
    ];

    try {
      const aiText = await askAI(messages);
      const parsed = tryParseJson(aiText);
      res.json({ success: true, data: parsed || { raw: aiText } });
    } catch (err) {
      logger.error('permit-eligibility AI error', { error: err.message, timestamp: new Date().toISOString() });
      res.status(503).json({ success: false, error: FALLBACK_RESPONSE });
    }
  }
);

// ─── POST /api/ai/categorize-feedback ──────────────────────────────────────
// Auto-tag citizen feedback for routing.
router.post(
  '/categorize-feedback',
  chatLimiter,
  authenticateToken,
  [
    body('feedback_text')
      .notEmpty().withMessage('feedback_text is required')
      .isString()
      .isLength({ max: 4000 }).trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    if (noKey()) {
      return res.status(503).json({ success: false, error: 'OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env to enable this endpoint.' });
    }

    const { feedback_text } = req.body;

    // Pull department list for routing context
    let deptContext = '';
    try {
      const r = await pool.query('SELECT name, description FROM departments LIMIT 25');
      deptContext = r.rows.map(d => `- ${d.name}: ${d.description}`).join('\n');
    } catch (_) {}

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Categorise the following citizen feedback for routing.

Feedback: "${feedback_text}"

Available departments:
${deptContext || 'Use general county government knowledge.'}

Return strict JSON:
{
  "primary_topic": "<short topic>",
  "tags": ["tag1", "tag2"],
  "sentiment": "positive|neutral|negative|mixed",
  "urgency": "low|medium|high|critical",
  "recommended_department": "<department>",
  "recommended_action": "<route|escalate|acknowledge|defer>",
  "summary": "<one sentence>",
  "notes": "<additional context>"
}`
      }
    ];

    try {
      const aiText = await askAI(messages);
      const parsed = tryParseJson(aiText);
      res.json({ success: true, data: parsed || { raw: aiText } });
    } catch (err) {
      logger.error('categorize-feedback AI error', { error: err.message, timestamp: new Date().toISOString() });
      res.status(503).json({ success: false, error: FALLBACK_RESPONSE });
    }
  }
);

module.exports = router;
