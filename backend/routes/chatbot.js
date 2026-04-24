const express = require('express');
const router = express.Router();
const https = require('https');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

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
    console.error('Context search error:', err.message);
  }

  return contexts;
}

function callOpenRouter(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
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

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const contexts = await getContextFromDB(message);
    const contextText = contexts.length > 0
      ? `\n\nRelevant county information found in our database:\n${contexts.join('\n')}`
      : '\n\nNo specific records were found in the county database for this query.';

    const systemPrompt = `You are a helpful AI assistant for the County Government Citizen Portal. You help residents find information about county services, meetings, events, permits, ordinances, and other government matters.

You have access to the county's database of public records. When answering questions, use the provided context from the database when available. Always be professional, helpful, and accurate.

If the information is available in the database context, cite it directly. If not, provide general guidance on how the resident can find the information they need.

Key departments to know about: Public Works, Parks & Recreation, Planning & Zoning, Finance, Public Safety, Health Services, Community Development, Human Resources, IT Services, County Clerk.${contextText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const aiResponse = await callOpenRouter(messages);

    // Save to chat history
    await pool.query(
      'INSERT INTO chat_history (user_id, message, response, context_used) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        message,
        aiResponse.choices?.[0]?.message?.content || 'No response generated',
        JSON.stringify(contexts)
      ]
    );

    res.json({
      success: true,
      data: {
        response: aiResponse.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.',
        model: aiResponse.model || process.env.OPENROUTER_MODEL,
        usage: aiResponse.usage || {},
        contexts_found: contexts.length,
        sources: contexts.slice(0, 5),
        raw_ai_response: {
          id: aiResponse.id,
          model: aiResponse.model,
          created: aiResponse.created,
          usage: aiResponse.usage,
          finish_reason: aiResponse.choices?.[0]?.finish_reason
        }
      }
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
