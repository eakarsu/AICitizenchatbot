import AIReport from './AIReport';
import FullAIExamples, { useFullAIExamples } from './FullAIExamples.jsx';
import React, { useState } from 'react';

const API_BASE = '';

function AccessibilityParaphrase() {
  const fullAIExamples = useFullAIExamples();
  const [text, setText] = useState('');
  const [readingLevel, setReadingLevel] = useState('grade-6');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResponse('');
    const levels = {
      'grade-3': 'a 3rd-grade reading level (very simple, short sentences)',
      'grade-6': 'a 6th-grade reading level (clear, plain English)',
      'grade-9': 'a 9th-grade reading level (everyday clarity)',
      'plain': 'plain English with no jargon',
    };
    const message = `Please paraphrase the following technical/legal/government text into ${levels[readingLevel] || 'plain English'}. Keep all key information accurate. Original text:\n\n${text}`;
    try {
      const res = await fetch(`${API_BASE}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResponse(data.data?.response || data.response || data.error || 'No response');
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\u267F'} Accessibility Paraphrasing</h1>
        <p>Simplify dense ordinances, legal text, or technical guidance for easier reading.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="AccessibilityParaphrase"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Reading Level</label>
        <select value={readingLevel} onChange={(e) => setReadingLevel(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: readingLevel, change: (e) => setReadingLevel(e.target.value), label: "readingLevel" }, "readingLevel")} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 16 }}>
          <option value="grade-3">3rd Grade (very simple)</option>
          <option value="grade-6">6th Grade (clear English)</option>
          <option value="grade-9">9th Grade (everyday)</option>
          <option value="plain">Plain English (no jargon)</option>
        </select>

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Original Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: text, change: (e) => setText(e.target.value), label: "text", sample: ["The applicant shall submit proof of residency and a completed permit application before scheduling an inspection.", "Property owners may appeal their annual assessment within the published filing period.", "Residents should place recycling containers curbside before 7 a.m. on collection day."] }, "text")}
          placeholder="Paste an ordinance, policy paragraph, or legal text here..."
          rows={8}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace', fontSize: 13 }}
          maxLength={5000}
          required
        />
        <small>{text.length}/5000 characters</small>

        <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()} style={{ marginTop: 16 }}>
          {loading ? 'Simplifying...' : 'Simplify Text'}
        </button>
      </form>

      {response && <AIReport response={response} title="Simplified version" />}
    </div>
  );
}

export default AccessibilityParaphrase;
