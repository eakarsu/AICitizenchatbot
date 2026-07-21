const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Existing routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/services', require('./routes/services'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/events', require('./routes/events'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/permits', require('./routes/permits'));
app.use('/api/ordinances', require('./routes/ordinances'));
app.use('/api/chatbot', require('./routes/chatbot'));

// New AI-enhanced chatbot endpoints
app.use('/api/chatbot', require('./routes/chatbotNew'));

// Feedback and analytics
app.use('/api/chatbot/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));

// Admin dashboard routes
app.use('/api/admin', require('./routes/admin'));

// Audit-recommended additions (notifications, exports/reports)
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/exports', require('./routes/exports'));

// Apply pass 4 — AI backlog endpoints (permit-eligibility, categorize-feedback)
app.use('/api/ai', require('./routes/aiBacklog'));

// Custom Views (Citizen Views) — 4 synthesized endpoints
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/service-sla-escalation', require('./routes/serviceSlaEscalation'));
app.use('/api/governed-service', require('./routes/governedService'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'County Citizen Chatbot API is running' });
});


app.use('/api/concierge-agent', require('./routes/conciergeAgent')); // apply pass 6 — audit custom suggestion

app.use('/api/ordinance-rag', require('./routes/ordinanceRag')); // apply pass 6 — audit custom suggestion

app.use('/api/emergency-broadcast', require('./routes/emergencyBroadcast')); // apply pass 6 — audit custom suggestion

app.use('/api/municipality-smb', require('./routes/municipalitySmbWhiteLabel')); // apply pass 6 — audit custom suggestion
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
