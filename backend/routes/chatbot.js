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

async function getContextFromDB(query) {
  const searchTerm = `%${query.toLowerCase()}%`;
  const contexts = [];

  try {
    const docs = await pool.query(
      "SELECT title, description, category FROM documents WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    docs.rows.forEach(r => contexts.push(`Document: ${r.title} - ${r.description}`));

    const meetings = await pool.query(
      "SELECT title, description, meeting_date, location FROM meetings WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    meetings.rows.forEach(r => contexts.push(`Meeting: ${r.title} on ${r.meeting_date} at ${r.location} - ${r.description}`));

    const announcements = await pool.query(
      "SELECT title, description, priority FROM announcements WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    announcements.rows.forEach(r => contexts.push(`Announcement: ${r.title} (${r.priority}) - ${r.description}`));

    const events = await pool.query(
      "SELECT title, description, event_date, location FROM events WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    events.rows.forEach(r => contexts.push(`Event: ${r.title} on ${r.event_date} at ${r.location} - ${r.description}`));

    const faqs = await pool.query(
      "SELECT question, answer FROM faqs WHERE LOWER(question) LIKE $1 OR LOWER(answer) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    faqs.rows.forEach(r => contexts.push(`FAQ: Q: ${r.question} A: ${r.answer}`));

    const services = await pool.query(
      "SELECT name, description, department, fee FROM services WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    services.rows.forEach(r => contexts.push(`Service: ${r.name} (${r.department}) - ${r.description}, Fee: ${r.fee}`));

    const departments = await pool.query(
      "SELECT name, description, head, phone, email FROM departments WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    departments.rows.forEach(r => contexts.push(`Department: ${r.name} - ${r.description}, Contact: ${r.phone}, ${r.email}`));

    const permits = await pool.query(
      "SELECT name, description, fee, processing_time FROM permits WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    permits.rows.forEach(r => contexts.push(`Permit: ${r.name} - ${r.description}, Fee: ${r.fee}, Processing: ${r.processing_time}`));

    const ordinances = await pool.query(
      "SELECT title, description, ordinance_number, effective_date FROM ordinances WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    ordinances.rows.forEach(r => contexts.push(`Ordinance ${r.ordinance_number}: ${r.title} (Effective: ${r.effective_date}) - ${r.description}`));

    const contacts = await pool.query(
      "SELECT name, title, department, phone, email FROM contacts WHERE LOWER(name) LIKE $1 OR LOWER(department) LIKE $1 OR LOWER(title) LIKE $1 LIMIT 3",
      [searchTerm]
    );
    contacts.rows.forEach(r => contexts.push(`Contact: ${r.name}, ${r.title} at ${r.department} - ${r.phone}, ${r.email}`));
  } catch (err) {
    logger.error('Context search error', { message: err.message, stack: err.stack });
  }

  return contexts;
}

function callOpenRouter(messages) {
  return new Promise((resolve, reject) => {
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/chat/completions`);
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
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

// Validation rules for chat POST
const chatValidation = [
  body('message')
    .notEmpty().withMessage('Message is required')
    .isString().withMessage('Message must be a string')
    .isLength({ max: 500 }).withMessage('Message must not exceed 500 characters')
    .trim(),
  body('conversation_id')
    .optional()
    .isUUID().withMessage('conversation_id must be a valid UUID'),
];

// POST / — main chat endpoint with rate limiting, validation, error logging, fallback
router.post('/', chatLimiter, authenticateToken, chatValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { message } = req.body;

    const contexts = await getContextFromDB(message);
    const contextText = contexts.length > 0
      ? `\n\nRelevant county information found in our database:\n${contexts.join('\n')}`
      : '\n\nNo specific records were found in the county database for this query.';

    const systemPrompt = `${SYSTEM_PROMPT}

You have access to the county's database of public records. When answering questions, use the provided context from the database when available. Always be professional, helpful, and accurate.

If the information is available in the database context, cite it directly. If not, provide general guidance on how the resident can find the information they need.

Key departments to know about: Public Works, Parks & Recreation, Planning & Zoning, Finance, Public Safety, Health Services, Community Development, Human Resources, IT Services, County Clerk.${contextText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    let aiResponse;
    let responseText;
    let usedFallback = false;

    try {
      aiResponse = await callOpenRouter(messages);
      responseText = aiResponse.choices?.[0]?.message?.content || FALLBACK_RESPONSE;
    } catch (aiErr) {
      logger.error('OpenRouter AI call failed', {
        timestamp: new Date().toISOString(),
        error: aiErr.message,
        stack: aiErr.stack,
        userId: req.user?.id,
        messageLength: message.length,
      });
      responseText = FALLBACK_RESPONSE;
      usedFallback = true;
    }

    // Log unanswered/failure signals for admin review
    const lowerResponse = responseText.toLowerCase();
    const seemsUnanswered = usedFallback ||
      lowerResponse.includes("i don't know") ||
      lowerResponse.includes("i'm not sure") ||
      lowerResponse.includes("i cannot") ||
      lowerResponse.includes("i'm unable") ||
      lowerResponse.includes("temporarily unavailable");

    // Save to chat history
    try {
      await pool.query(
        'INSERT INTO chat_history (user_id, message, response, context_used) VALUES ($1, $2, $3, $4)',
        [
          req.user.id,
          message,
          responseText,
          JSON.stringify(contexts)
        ]
      );
    } catch (dbErr) {
      logger.error('Failed to save chat history', { error: dbErr.message, userId: req.user.id });
    }

    // Track unanswered questions
    if (seemsUnanswered) {
      try {
        await pool.query(
          `INSERT INTO unanswered_questions (user_id, question, bot_response, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT DO NOTHING`,
          [req.user.id, message, responseText]
        );
      } catch (_) {
        // Table may not exist yet — non-fatal
      }
    }

    res.json({
      success: true,
      data: {
        response: responseText,
        fallback_used: usedFallback,
        model: aiResponse?.model || process.env.OPENROUTER_MODEL,
        usage: aiResponse?.usage || {},
        contexts_found: contexts.length,
        sources: contexts.slice(0, 5),
        raw_ai_response: usedFallback ? null : {
          id: aiResponse.id,
          model: aiResponse.model,
          created: aiResponse.created,
          usage: aiResponse.usage,
          finish_reason: aiResponse.choices?.[0]?.finish_reason
        }
      }
    });
  } catch (err) {
    logger.error('Chatbot endpoint error', {
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: err.stack,
      userId: req.user?.id,
    });
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /history — paginated conversation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM chat_history WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
