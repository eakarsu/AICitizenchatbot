const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { open_requests: 146, breach_risk: 19, escalated: 8, avg_response_hours: 11.6 },
    requests: [
      { ticket: '311-8821', service: 'missed trash pickup', ward: 'Ward 3', hours_left: 2, action: 'escalate sanitation supervisor' },
      { ticket: '311-8844', service: 'streetlight outage', ward: 'Ward 1', hours_left: 7, action: 'bundle with utility crew' },
      { ticket: '311-8902', service: 'permit question', ward: 'Ward 5', hours_left: 20, action: 'send status update' },
    ],
  });
});

router.post('/escalate', (req, res) => {
  const { ticket = 'ticket', service = 'service' } = req.body || {};
  res.json({ ticket, service, status: 'escalated', notify: ['department owner', 'resident'] });
});

module.exports = router;
