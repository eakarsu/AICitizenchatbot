const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

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


// === Batch 01 Gaps & Frontend Mounts ===
app.use('/api/gap-0-mounted-ai-endpoints-in-chatbot-js-chatbotnew-js', require('./routes/gap_0_mounted_ai_endpoints_in_chatbot_js_chatbotnew_js'));
app.use('/api/gap-no-multilingual-support-for-non-english-speaking-r', require('./routes/gap_no_multilingual_support_for_non_english_speaking_r'));
app.use('/api/gap-no-ai-311-ticket-triage-and-routing', require('./routes/gap_no_ai_311_ticket_triage_and_routing'));
app.use('/api/gap-no-ai-form-filling-assistance-for-permits-licenses', require('./routes/gap_no_ai_form_filling_assistance_for_permits_licenses'));
app.use('/api/gap-frontend-pages-folder-is-empty-no-spa-ui-shipped', require('./routes/gap_frontend_pages_folder_is_empty_no_spa_ui_shipped'));
app.use('/api/gap-notification-routes-exist-but-no-sms-email-deliver', require('./routes/gap_notification_routes_exist_but_no_sms_email_deliver'));
app.use('/api/gap-no-webhook-outbound-api', require('./routes/gap_no_webhook_outbound_api'));
app.use('/api/gap-no-gis-mapping-integration', require('./routes/gap_no_gis_mapping_integration'));
app.use('/api/gap-no-accessibility-wcag-audits-and-voice-first-inter', require('./routes/gap_no_accessibility_wcag_audits_and_voice_first_inter'));
app.use('/api/gap-no-sla-tracking-on-service-catalog', require('./routes/gap_no_sla_tracking_on_service_catalog'));
