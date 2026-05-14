import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const body = { rating, comment };
      if (conversationId.trim()) body.conversation_id = conversationId.trim();
      const res = await fetch(`${API_BASE}/api/chatbot/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setRating(0);
        setComment('');
        setConversationId('');
      } else {
        setError(data.errors?.[0]?.msg || data.error || 'Failed');
      }
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83D\uDCAC'} Submit Feedback</h1>
        <p>Tell us how well the chatbot answered your question.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24, maxWidth: 600 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Rating</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              style={{
                fontSize: 32,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: n <= rating ? '#fbbf24' : '#d1d5db',
              }}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              {'\u2605'}
            </button>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Conversation ID (optional)</label>
        <input
          type="text"
          value={conversationId}
          onChange={(e) => setConversationId(e.target.value)}
          placeholder="e.g., a UUID from a recent chat"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}
        />

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike about the response?"
          rows={5}
          maxLength={1000}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <small>{comment.length}/1000</small>

        <div style={{ marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={submitting || rating === 0}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>

        {error && <div style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}
        {success && <div style={{ marginTop: 16, padding: 12, background: '#d1fae5', color: '#065f46', borderRadius: 8 }}>{'\u2705'} Thanks for your feedback!</div>}
      </form>
    </div>
  );
}

export default FeedbackForm;
