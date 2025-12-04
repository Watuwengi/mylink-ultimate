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
    <p style="color:#0f0">SMS sent successfully!</p>
  `);

  // === SEND SMS VIA GMAIL (your 16-digit password is already in Render) ===
  if (input && process.env.GMAIL_PASS) {
    try {
      const nodemailer = require('nodemailer');
      let num = input.replace(/\D/g, '');
      if (num.startsWith('0')) num = '254' + num.slice(1);
      if (num.startsWith('2540')) num = num.slice(1);   // fix double 0
      if (num.startsWith('254')) num = num.slice(3);

      let gateway = '@safaricom.co.ke';
      if (['73','74','75','76','78','79'].some(p => num.startsWith(p))) gateway = '@airtelkenya.com';
      if (num.startsWith('77')) gateway = '@sms.telkom.co.ke';

      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: { user: 'emmanuelwamb107@gmail.com', pass: process.env.GMAIL_PASS }
      });

      await transporter.sendMail({
        from: 'MyLink',
        to: num + gateway,
        text: 'MyLink: ' + link
      });
    } catch (e) {
      console.log('SMS failed (link still works)');
    }
  }
});

io.on('connection', socket => {
  socket.on('offer',  data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
});

server.listen(process.env.PORT || 3000, () => console.log('MyLink Ultimate + SMS LIVE'));
