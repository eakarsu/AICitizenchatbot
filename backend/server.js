const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'County Citizen Chatbot API is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
