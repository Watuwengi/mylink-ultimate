const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use('/files', express.static('uploads'));

// Gmail SMTP (your app password in Render env)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'emmanuelwamb107@gmail.com',
    pass: process.env.GMAIL_PASS
  }
});

// Kenyan SMS gateways
const gateways = {
  safaricom: '@safaricom.co.ke',
  airtel: '@airtelkenya.com',
  telkom: '@sms.telkom.co.ke'
};

app.get('/send', async (req, res) => {
  const target = (req.query.target || '').trim();
  if (!target) return res.send('<p style="color:red">Enter email/number</p>');

  const token = Date.now().toString(36);
  const link = `${req.protocol}://${req.get('host')}/phone?t=${token}`;

  let to = '';
  if (/^(\+254|0)?7[1-9]\d{8}$/.test(target)) {
    let num = target.replace(/\D/g, '');
    if (num.startsWith('0')) num = '254' + num.slice(1);
    num = num.slice(3);
    if (num.startsWith('71') || num.startsWith('72')) to = num + gateways.safaricom;
    else if (num.startsWith('73') || num.startsWith('78')) to = num + gateways.airtel;
    else if (num.startsWith('77')) to = num + gateways.telkom;
  } else if (target.includes('@')) {
    to = target;
  }

  if (to) {
    try {
      await transporter.sendMail({
        from: 'MyLink <emmanuelwamb107@gmail.com>',
        to,
        subject: '',
        text: `Connect now: ${link}`
      });
      res.send(`<p style="color:#0f9">Sent to ${target}!</p>`);
    } catch (e) {
      res.send(`<p style="color:#0f9">Link ready!</p><a href="${link}">${link}</a>`);
    }
  } else {
    res.send(`<p style="color:#0f9">Link ready!</p><a href="${link}">${link}</a>`);
  }
});

// File upload
app.post('/upload', upload.array('files'), (req, res) => {
  io.emit('newfiles', req.files.map(f => ({
    name: f.originalname,
    path: `/files/${f.filename}`
  })));
  res.send('Uploaded!');
});

io.on('connection', socket => {
  socket.on('offer', data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
  socket.on('ice', data => socket.broadcast.emit('ice', data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('MyLink Ultimate LIVE'));
