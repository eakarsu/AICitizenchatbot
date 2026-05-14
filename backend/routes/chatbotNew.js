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
  "You are a helpful county government assistant. Provide accurate information about local services, permits, and procedures. Be clear, concise, and direct citizens to appropriate departments when needed.";

function callOpenRouter(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages,
      max_tokens: 1024,
      temperature: 0.5,
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

// Generate a simple case number prefix
function generateCasePrefix(category) {
  const prefixes = {
    pothole: 'PW',
    noise: 'NB',
    permit: 'PM',
    utility: 'UT',
    trash: 'SW',
    parking: 'PK',
    graffiti: 'GF',
    streetlight: 'SL',
    other: 'GN',
  };
  const key = Object.keys(prefixes).find(k => category.toLowerCase().includes(k)) || 'other';
  const ts = Date.now().toString().slice(-6);
  return `${prefixes[key]}-${ts}`;
}

// ─── POST /api/chatbot/service-finder ──────────────────────────────────────────
router.post(
  '/service-finder',
  chatLimiter,
  authenticateToken,
  [
    body('citizen_description_of_need')
      .notEmpty().withMessage('citizen_description_of_need is required')
      .isString()
      .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters')
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { citizen_description_of_need } = req.body;

    // Gather department info from DB for context
    let departmentContext = '';
    try {
      const depts = await pool.query('SELECT name, description, phone, email, website FROM departments LIMIT 20');
      departmentContext = depts.rows.map(d =>
        `- ${d.name}: ${d.description} | Phone: ${d.phone} | Email: ${d.email}`
      ).join('\n');
    } catch (_) {}

    let serviceContext = '';
    try {
      const svcs = await pool.query('SELECT name, description, department, fee FROM services LIMIT 20');
      serviceContext = svcs.rows.map(s =>
        `- ${s.name} (${s.department}): ${s.description} | Fee: ${s.fee}`
      ).join('\n');
    } catch (_) {}

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `A citizen needs help finding the right county service. Based on their description, identify the correct department and service, then provide contact info and step-by-step instructions.

Citizen need: "${citizen_description_of_need}"

Available departments:
${departmentContext || 'Use general county government knowledge.'}

Available services:
${serviceContext || 'Use general county government knowledge.'}

Respond in JSON format:
{
  "department": "<department name>",
  "service": "<service name>",
  "contact_info": { "phone": "...", "email": "...", "website": "..." },
  "steps": ["step 1", "step 2", ...],
  "estimated_time": "<time estimate>",
  "fees": "<fee info>",
  "notes": "<any additional notes>"
}`
      }
    ];

    try {
      const aiText = await askAI(messages);
      let parsed = null;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      res.json({ success: true, data: parsed || { raw: aiText } });
    } catch (err) {
      logger.error('service-finder AI error', { error: err.message, timestamp: new Date().toISOString() });
      res.status(503).json({ success: false, error: FALLBACK_RESPONSE });
    }
  }
);

// ─── POST /api/chatbot/complaint-classifier ────────────────────────────────────
router.post(
  '/complaint-classifier',
  chatLimiter,
  authenticateToken,
  [
    body('complaint_text')
      .notEmpty().withMessage('complaint_text is required')
      .isString()
      .isLength({ max: 2000 }).withMessage('Complaint text must not exceed 2000 characters')
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { complaint_text } = req.body;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Classify the following citizen complaint. Identify the category, assign a priority level, and return a JSON response.

Complaint: "${complaint_text}"

Categories: pothole, noise, permit, utility, trash, parking, graffiti, streetlight, other
Priority levels: critical, high, medium, low

Respond in JSON format:
{
  "category": "<category>",
  "priority": "<priority>",
  "department": "<responsible department>",
  "summary": "<one-sentence summary>",
  "estimated_resolution_days": <number>,
  "notes": "<any additional notes>"
}`
      }
    ];

    try {
      const aiText = await askAI(messages);
      let parsed = null;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      const category = parsed?.category || 'other';
      const caseNumberPrefix = generateCasePrefix(category);

      res.json({
        success: true,
        data: {
          ...(parsed || { raw: aiText }),
          case_number_prefix: caseNumberPrefix,
          case_reference: `${caseNumberPrefix}-${new Date().getFullYear()}`,
        }
      });
    } catch (err) {
      logger.error('complaint-classifier AI error', { error: err.message, timestamp: new Date().toISOString() });
      res.status(503).json({ success: false, error: FALLBACK_RESPONSE });
    }
  }
);

// ─── POST /api/chatbot/appointment-helper ─────────────────────────────────────
router.post(
  '/appointment-helper',
  chatLimiter,
  authenticateToken,
  [
    body('service_type')
      .notEmpty().withMessage('service_type is required')
      .isString()
      .isLength({ max: 200 }).withMessage('service_type must not exceed 200 characters')
      .trim(),
    body('preferred_dates')
      .optional()
      .isArray().withMessage('preferred_dates must be an array'),
    body('preferred_dates.*')
      .optional()
      .isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { service_type, preferred_dates = [] } = req.body;

    // Look up service in DB
    let serviceContext = '';
    try {
      const svc = await pool.query(
        "SELECT name, description, department, fee, processing_time FROM services WHERE LOWER(name) LIKE $1 LIMIT 3",
        [`%${service_type.toLowerCase()}%`]
      );
      serviceContext = svc.rows.map(s =>
        `${s.name}: ${s.description} | Dept: ${s.department} | Fee: ${s.fee} | Processing: ${s.processing_time}`
      ).join('\n');
    } catch (_) {}

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `A citizen wants to schedule an appointment for: "${service_type}"
Preferred dates: ${preferred_dates.length > 0 ? preferred_dates.join(', ') : 'Not specified'}

Service info from database:
${serviceContext || 'No specific service found — use general knowledge.'}

Generate a document checklist and appointment guidance. Respond in JSON format:
{
  "service_name": "<confirmed service name>",
  "department": "<department>",
  "document_checklist": ["document 1", "document 2", ...],
  "appointment_tips": ["tip 1", "tip 2", ...],
  "estimated_duration_minutes": <number>,
  "fee": "<fee info>",
  "scheduling_note": "<how to schedule / online portal info>",
  "availability_note": "<general availability info for preferred dates if provided>"
}`
      }
    ];

    try {
      const aiText = await askAI(messages);
      let parsed = null;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      res.json({ success: true, data: parsed || { raw: aiText } });
    } catch (err) {
      logger.error('appointment-helper AI error', { error: err.message, timestamp: new Date().toISOString() });
      res.status(503).json({ success: false, error: FALLBACK_RESPONSE });
    }
  }
);

// ─── POST /api/chatbot/permit-guide ───────────────────────────────────────────
router.post(
  '/permit-guide',
  chatLimiter,
  authenticateToken,
  [
    body('project_description')
      .notEmpty().withMessage('project_description is required')
      .isString()
      .isLength({ max: 1000 }).withMessage('project_description must not exceed 1000 characters')
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { project_description } = req.body;

    // Fetch permits from DB
    let permitContext = '';
    try {
      const permits = await pool.query('SELECT name, description, fee, processing_time FROM permits LIMIT 20');
      permitContext = permits.rows.map(p =>
        `- ${p.name}: ${p.description} | Fee: ${p.fee} | Processing: ${p.processing_time}`
      ).join('\n');
    } catch (_) {}

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `A citizen is planning the following project and needs permit guidance:
"${project_description}"

Available county permits:
${permitContext || 'Use general county permit knowledge.'}

Identify all required permits, fees, processing times, and steps. Respond in JSON format:
{
  "required_permits": [
    {
      "name": "<permit name>",
      "description": "<why it's needed>",
      "fee": "<fee>",
      "processing_time": "<time>",
      "application_steps": ["step 1", "step 2", ...]
    }
  ],
  "total_estimated_fees": "<total fee range>",
  "total_estimated_timeline": "<overall timeline>",
  "additional_requirements": ["requirement 1", ...],
  "contact_department": "<department to contact>",
  "notes": "<any caveats or special considerations>"
}`
      }
    ];

    try {
      const aiText = await askAI(messages);
      let parsed = null;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      res.json({ success: true, data: parsed || { raw: aiText } });
    } catch (err) {
      logger.error('permit-guide AI error', { error: err.message, timestamp: new Date().toISOString() });
      res.status(503).json({ success: false, error: FALLBACK_RESPONSE });
    }
  }
);

module.exports = router;
