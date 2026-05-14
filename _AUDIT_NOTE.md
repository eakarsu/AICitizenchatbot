# Audit Note — AICitizenchatbot

Source: `_AUDIT/reports/batch_01.md` (Project 24)

## Maturity: PARTIAL-BUILD (16 routes; audit reports 0 AI endpoints though `chatbot.js` does call OpenRouter)

## Original audit recommendations

### Gaps & Opportunities
- Missing AI Layer: 0 AI endpoints despite operational routes.
- Missing Notifications.
- Missing Reporting.
- Missing Integration API.

### Strategic Feature Suggestions
1. Agentic Workflow Orchestration
2. RAG over Domain Documents
3. Real-time Anomaly Detection
4. White-label/Reseller Platform

## Categorization
- **MECHANICAL:** notifications subsystem, exports/reports.
- **NEEDS-PRODUCT-DECISION:** agentic workflows, RAG over policy documents (which docs? per-county schema), white-label.

## Implementations applied
1. **`backend/routes/notifications.js`** — full CRUD (DB-detect + memory fallback).
2. **`backend/routes/exports.js`** — `/summary` + CSV exports for services, permits, announcements, feedback.
3. **`backend/server.js`** — mounted both at `/api/notifications` and `/api/exports`.

Syntax-checked with `node --check`.

Note: the audit asserts "0 AI endpoints" but `routes/chatbot.js` already integrates an OpenRouter LLM via the chatbot question/answer loop. Treated this as already covered for the AI layer.

## Backlog (prioritized)

### High priority
- **Webhook subsystem** for outbound integrations (similar to ChurchMosqueTemple project).
- **`POST /api/ai/permit-eligibility`** — given citizen profile + permit type, return eligibility + missing-document list.
- **`POST /api/ai/categorize-feedback`** — auto-tag citizen feedback for routing.

### Medium priority
- **RAG over ordinances** — vector index of ordinances + meeting minutes.
- **Multi-language support** for chatbot.
- **Email/SMS dispatcher** on top of notifications.

### Low priority
- White-label per-county branding.
- Agentic citizen-issue resolution workflow.

## Apply pass 3 (frontend)

Verified existing FE wiring; **LEFT-AS-IS**.

- Frontend already implements pages/components for every AI route added in pass 2: `Chatbot`, `ServiceFinder`, `ComplaintClassifier`, `AppointmentHelper`, `PermitGuide`, `ResourceNavigator`, `MultiLanguage`, `AccessibilityParaphrase`, `FeedbackForm`, `AdminAnalytics`, `Notifications`, `Exports` — all routed in `frontend/src/App.js`.
- All components issue `fetch(${API_BASE}/api/...)` with `Authorization: Bearer <token>` from `localStorage`.
- `Notifications` and `Exports` cover the pass 2 backend additions; AI feature components cover the pre-existing `chatbot.js` endpoints.
- No code changes; idempotence rule applied. Log: `_AUDIT/apply3_logs/ab3_59.md`.

## Apply pass 4 (mechanical backlog)

ALREADY-DONE — verified pre-existing pass-4 implementation; no changes.

- BE `backend/routes/aiBacklog.js` already implements `POST /api/ai/permit-eligibility` and `POST /api/ai/categorize-feedback` (OpenRouter via direct https, 503 on missing key, `authenticateToken` + `chatLimiter`).
- Mounted in `backend/server.js:41` on `/api/ai`.
- FE pages exist (`components/PermitEligibility.js`, `components/CategorizeFeedback.js`) and are routed in `App.js:62-63`.
- Auth via `Authorization: Bearer <token>` from localStorage; 503 surfaced as user message.
- Remaining backlog: RAG over ordinances (NEEDS-PRODUCT-DECISION), email/SMS dispatcher (NEEDS-CREDS), white-label (NEEDS-PRODUCT-DECISION), multi-language chatbot (NEEDS-PRODUCT-DECISION on language list/translation provider). All deferred per pass directive.

Log: `_AUDIT/apply4_logs/ab3_59.md`.
