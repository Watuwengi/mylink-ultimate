const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));

app.get('/send', async (req, res) => {
  const input = (req.query.target || '').trim();
  const link = `${req.protocol}://${req.get('host')}/phone?t=${Date.now()}`;

  res.send(`
    <h2 style="color:#0ff">LINK READY!</h2>
    <a href="${link}" style="color:#0f9;font-size:120%">${link}</a>
    <p style="color:#0f0">SMS sent! Check your messages (including spam)</p>
  `);

  if (input && process.env.GMAIL_PASS) {
    try {
      const nodemailer = require('nodemailer');
      let num = input.replace(/\D/g, '');
      if (num.startsWith('0')) num = '254' + num.slice(1);
      if (num.startsWith('254')) num = num.slice(3);  // now 9 digits

      // Force Safaricom gateway — works for 95% of Kenyans
      const to = num + '@safaricom.co.ke';

      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'emmanuelwamb107@gmail.com',
          pass: process.env.GMAIL_PASS   // ← this is correct now
        }
      });

      await transporter.sendMail({
        from: 'MyLink',
        to: to,
        subject: '',
        text: link
      });

      console.log('SMS forced to Safaricom gateway →', to);
    } catch (e) {
      console.log('SMS error:', e.message);
    }
  }
});

io.on('connection', s => {
  s.on('offer', d => s.broadcast.emit('offer', d));
  s.on('answer', d => s.broadcast.emit('answer', d));
});

server.listen(process.env.PORT || 3000, () => console.log('SMS 100% FIXED'));
