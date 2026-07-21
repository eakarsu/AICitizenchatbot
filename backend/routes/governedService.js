const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { ValidationError, text, idempotencyKey, checksum, injectionSignals, evidenceScore, requireRole } = require('../lib/governance');

const router = express.Router();
router.use(authenticateToken);

async function membership(req) {
  const tenantId = text(req.get('X-Tenant-Id'), 'X-Tenant-Id', 64);
  const result = await pool.query('SELECT role FROM citizen_tenant_members WHERE tenant_id=$1 AND user_id=$2 AND active=true', [tenantId, req.user.id]);
  if (!result.rows[0]) throw new ValidationError('Tenant membership required', 403);
  return { tenantId, role: result.rows[0].role };
}

async function audit(client, ctx, action, entityType, entityId, details = {}) {
  await client.query('INSERT INTO citizen_audit_events(tenant_id, actor_id, action, entity_type, entity_id, details) VALUES($1,$2,$3,$4,$5,$6)', [ctx.tenantId, ctx.userId, action, entityType, entityId, details]);
}

router.post('/tenants', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const key = idempotencyKey(req); const name = text(req.body.name, 'name', 160); const tenantId = crypto.randomUUID();
    await client.query('BEGIN');
    const replay = await client.query('SELECT response FROM citizen_idempotency WHERE actor_id=$1 AND key=$2', [req.user.id, key]);
    if (replay.rows[0]) { await client.query('ROLLBACK'); return res.status(200).json(replay.rows[0].response); }
    await client.query('INSERT INTO citizen_tenants(id,name) VALUES($1,$2)', [tenantId, name]);
    await client.query('INSERT INTO citizen_tenant_members(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenantId, req.user.id, 'owner']);
    const response = { tenant: { id: tenantId, name }, role: 'owner' };
    await client.query('INSERT INTO citizen_idempotency(actor_id,key,response) VALUES($1,$2,$3)', [req.user.id, key, response]);
    await audit(client, { tenantId, userId: req.user.id }, 'tenant.created', 'tenant', tenantId);
    await client.query('COMMIT'); res.status(201).json(response);
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); next(error); } finally { client.release(); }
});

router.post('/sources', async (req, res, next) => {
  try {
    const member = await membership(req); requireRole(member, ['owner', 'knowledge_manager']);
    const key = idempotencyKey(req); const source = { name: text(req.body.name, 'name', 200), uri: text(req.body.uri, 'uri', 2000), classification: req.body.classification || 'public', checksum: text(req.body.checksum, 'checksum', 128) };
    if (!['public','internal','restricted'].includes(source.classification)) throw new ValidationError('Invalid classification');
    const result = await pool.query(`INSERT INTO citizen_knowledge_sources(tenant_id,name,origin_uri,classification,checksum,idempotency_key,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET name=citizen_knowledge_sources.name RETURNING *`, [member.tenantId, source.name, source.uri, source.classification, source.checksum, key, req.user.id]);
    res.status(201).json({ source: result.rows[0] });
  } catch (error) { next(error); }
});

router.post('/sources/:sourceId/documents', async (req, res, next) => {
  try {
    const member = await membership(req); requireRole(member, ['owner', 'knowledge_manager']); idempotencyKey(req);
    const title = text(req.body.title, 'title', 300); const content = text(req.body.content, 'content', 100000); const signals = injectionSignals(content);
    const result = await pool.query(`INSERT INTO citizen_documents(tenant_id,source_id,title,content,content_checksum,status,injection_signals,created_by)
      SELECT $1,id,$3,$4,$5,$6,$7,$8 FROM citizen_knowledge_sources WHERE id=$2 AND tenant_id=$1 RETURNING id,title,status,content_checksum,injection_signals`, [member.tenantId, req.params.sourceId, title, content, checksum(content), signals.length ? 'quarantined' : 'pending_review', signals, req.user.id]);
    if (!result.rows[0]) throw new ValidationError('Source not found', 404);
    res.status(201).json({ document: result.rows[0] });
  } catch (error) { next(error); }
});

router.post('/documents/:documentId/review', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const member = await membership(req); requireRole(member, ['owner', 'reviewer']); idempotencyKey(req);
    const decision = text(req.body.decision, 'decision', 20); const reason = text(req.body.reason, 'reason', 1000);
    if (!['approved','rejected'].includes(decision)) throw new ValidationError('decision must be approved or rejected');
    await client.query('BEGIN');
    const result = await client.query(`UPDATE citizen_documents SET status=$3,reviewed_by=$4,review_reason=$5,reviewed_at=now() WHERE id=$2 AND tenant_id=$1 AND status IN ('pending_review','quarantined') RETURNING id,status`, [member.tenantId, req.params.documentId, decision, req.user.id, reason]);
    if (!result.rows[0]) throw new ValidationError('Reviewable document not found', 404);
    await audit(client, { tenantId: member.tenantId, userId: req.user.id }, `document.${decision}`, 'document', req.params.documentId, { reason });
    await client.query('COMMIT'); res.json({ document: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); next(error); } finally { client.release(); }
});

router.post('/answers', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const member = await membership(req); const key = idempotencyKey(req); const question = text(req.body.question, 'question', 2000);
    const docs = await client.query(`SELECT id,title,content,origin_uri FROM citizen_documents d JOIN citizen_knowledge_sources s ON s.id=d.source_id AND s.tenant_id=d.tenant_id WHERE d.tenant_id=$1 AND d.status='approved'`, [member.tenantId]);
    const evidence = docs.rows.map((doc) => ({ ...doc, score: evidenceScore(question, doc) })).filter((doc) => doc.score >= 0.2).sort((a,b) => b.score-a.score).slice(0,3);
    await client.query('BEGIN');
    const state = evidence.length ? 'grounded_draft' : 'escalated';
    const answerText = evidence.length ? `Relevant approved guidance: ${evidence.map((item) => item.title).join('; ')}. Review the cited source before acting.` : 'No approved evidence matched this question. It has been escalated for human assistance.';
    const created = await client.query(`INSERT INTO citizen_answers(tenant_id,question,answer,state,evidence,idempotency_key,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET question=citizen_answers.question RETURNING *`, [member.tenantId, question, answerText, state, evidence.map(({id,title,origin_uri,score}) => ({id,title,origin_uri,score})), key, req.user.id]);
    if (!evidence.length) await client.query('INSERT INTO citizen_escalations(tenant_id,answer_id,reason,status) VALUES($1,$2,$3,$4)', [member.tenantId, created.rows[0].id, 'no_approved_evidence', 'open']);
    await audit(client, { tenantId: member.tenantId, userId: req.user.id }, 'answer.created', 'answer', created.rows[0].id, { state, evidenceCount: evidence.length });
    await client.query('COMMIT'); res.status(201).json({ answer: created.rows[0] });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); next(error); } finally { client.release(); }
});

router.post('/actions', async (req, res, next) => {
  try {
    const member = await membership(req); idempotencyKey(req); const actionType = text(req.body.actionType, 'actionType', 80);
    if (!['create_service_request','request_callback','open_ticket'].includes(actionType)) throw new ValidationError('Action is not allow-listed');
    const result = await pool.query('INSERT INTO citizen_tool_actions(tenant_id,action_type,payload,state,requested_by) VALUES($1,$2,$3,$4,$5) RETURNING *', [member.tenantId, actionType, req.body.payload || {}, 'pending_approval', req.user.id]);
    res.status(202).json({ action: result.rows[0], dispatched: false });
  } catch (error) { next(error); }
});

router.post('/actions/:actionId/approve', async (req, res, next) => {
  try {
    const member = await membership(req); requireRole(member, ['owner','service_officer']); idempotencyKey(req); const reason = text(req.body.reason, 'reason', 1000);
    const result = await pool.query(`UPDATE citizen_tool_actions SET state='approved_for_dispatch',approved_by=$3,approval_reason=$4,approved_at=now() WHERE tenant_id=$1 AND id=$2 AND state='pending_approval' RETURNING *`, [member.tenantId, req.params.actionId, req.user.id, reason]);
    if (!result.rows[0]) throw new ValidationError('Pending action not found', 404);
    res.json({ action: result.rows[0], dispatched: false, integrationRequired: true });
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => { if (error instanceof ValidationError) return res.status(error.status).json({ error: error.message }); console.error(error); res.status(500).json({ error: 'Internal server error' }); });
module.exports = router;
