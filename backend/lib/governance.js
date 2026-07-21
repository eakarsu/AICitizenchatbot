const crypto = require('crypto');

class ValidationError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function text(value, field, max = 4000) {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${field} is required`);
  const clean = value.trim();
  if (clean.length > max) throw new ValidationError(`${field} exceeds ${max} characters`);
  return clean;
}

function idempotencyKey(req) {
  const key = req.get('Idempotency-Key');
  if (!key || !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new ValidationError('A valid Idempotency-Key is required');
  return key;
}

function checksum(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

function injectionSignals(value) {
  const patterns = [/ignore (all|previous) instructions/i, /system prompt/i, /reveal (secrets|credentials)/i, /<script/i];
  return patterns.filter((pattern) => pattern.test(value)).map(String);
}

function evidenceScore(query, document) {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) || [])];
  if (!terms.length) return 0;
  const haystack = `${document.title || ''} ${document.content || ''}`.toLowerCase();
  return terms.filter((term) => haystack.includes(term)).length / terms.length;
}

function requireRole(user, allowed) {
  if (!user || !allowed.includes(user.role)) throw new ValidationError('Insufficient role', 403);
}

module.exports = { ValidationError, text, idempotencyKey, checksum, injectionSignals, evidenceScore, requireRole };
