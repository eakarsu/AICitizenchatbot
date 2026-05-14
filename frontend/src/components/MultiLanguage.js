import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'vi', name: 'Vietnamese' },
];

function MultiLanguage() {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('es');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setResponse('');
    const langName = LANGUAGES.find((l) => l.code === language)?.name || 'Spanish';
    const message = `Please respond in ${langName}: ${question}`;
    try {
      const res = await fetch(`${API_BASE}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResponse(data.response || data.error || 'No response');
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83C\uDF10'} Multi-language Support</h1>
        <p>Ask any county question in your preferred language; AI responds in your chosen language.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Response Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Your Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., How do I apply for a building permit?"
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={2000}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={loading || !question.trim()} style={{ marginTop: 16 }}>
          {loading ? 'Translating...' : 'Get Response'}
        </button>
      </form>

      {response && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{LANGUAGES.find((l) => l.code === language)?.name} Response</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, direction: ['ar'].includes(language) ? 'rtl' : 'ltr' }}>{response}</div>
        </div>
      )}
    </div>
  );
}

export default MultiLanguage;
