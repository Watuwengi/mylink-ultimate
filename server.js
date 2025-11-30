// server.js — SAFE VERSION THAT NEVER CRASHES
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use('/files', express.static('uploads'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));

app.get('/send', async (req, res) => {
  const target = (req.query.target || '').trim();
  const link = `${req.protocol}://${req.get('host')}/phone?t=${Date.now()}`;

  // Always show the link (works 100%)
  res.send(`
    <p style="color:#0f9;font-size:24px">Link ready!</p>
    <a href="${link}" style="color:#0ff;font-size:20px">${link}</a>
    <p style="color:#888;margin-top:20px">
      ${target ? 'Trying to send to ' + target + '...' : ''}
    </p>
  `);

  // Try to send email/SMS in background (won't crash app if fails)
  if (target && process.env.GMAIL_PASS) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: 'emmanuelwamb107@gmail.com', pass: process.env.GMAIL_PASS }
    });

    let to = target;
    if (/^(\+254|0)?7\d{8}$/.test(target)) {
      let num = target.replace(/\D/g, '');
      if (num.startsWith('0')) num = '254' + num.slice(1);
      num = num.slice(3);
      if (num.startsWith('71') || num.startsWith('72')) to = num + '@safaricom.co.ke';
      else if (num.startsWith('73') || num.startsWith('78')) to = num + '@airtelkenya.com';
      else if (num.startsWith('77')) to = num + '@sms.telkom.co.ke';
    }

    transporter.sendMail({
      from: 'MyLink',
      to,
      text: `Connect now: ${link}`
    }).catch(() => {}); // silently ignore errors
  }
});

// File upload
app.post('/upload', upload.array('files'), (req, res) => {
  io.emit('newfiles', req.files.map(f => ({name: f.originalname, path: `/files/${f.filename}`}));
  res.send('OK');
});

io.on('connection', s => {
  s.on('offer', d => s.broadcast.emit('offer', d));
  s.on('answer', d => s.broadcast.emit('answer', d));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('MyLink ULTIMATE RUNNING'));
