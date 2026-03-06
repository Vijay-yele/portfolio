const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── HTML escape helper (prevents XSS in email templates)
function escapeHtml(str) {
  if (!str) return '';
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

// ── Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Rate limiter: 5 requests per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Contact Form API
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Required fields missing.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Sanitize all user inputs
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: 'vijayyele121@gmail.com',
      replyTo: safeEmail,
      subject: `[Portfolio] ${safeSubject || 'New Message'} — from ${safeName}`,
      html: `
        <div style="font-family:monospace;background:#040407;color:#eeeef5;padding:2rem;border:1px solid #1a1a2e;">
          <h2 style="color:#00ff9d;margin-bottom:1.5rem;font-size:1.2rem;">📬 New Portfolio Contact</h2>
          <p style="margin:0.5rem 0"><span style="color:#5a5a78">FROM:</span> ${safeName}</p>
          <p style="margin:0.5rem 0"><span style="color:#5a5a78">EMAIL:</span> ${safeEmail}</p>
          <p style="margin:0.5rem 0"><span style="color:#5a5a78">SUBJECT:</span> ${safeSubject || 'N/A'}</p>
          <hr style="border:none;border-top:1px solid #1a1a2e;margin:1.5rem 0">
          <p style="color:#5a5a78;margin-bottom:0.5rem">MESSAGE:</p>
          <p style="line-height:1.8;color:#8888a8">${safeMessage.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Email failed.' });
  }
});

// ── SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Vijay Portfolio running → http://localhost:${PORT}`);
});
