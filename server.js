const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Gmail setup (update your app password)
let transporter;
try {
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'emmanuelwamb107@gmail.com',  // Your email
      pass: 'your-app-password'  // 16-digit app password
    }
  });
} catch (err) {
  console.error('Gmail setup error:', err);
}

// Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Phone page
app.get('/phone', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'phone.html'));
});

// Send magic link
app.get('/link', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.send('<p style="color:red">Enter email</p>');

  const token = crypto.randomBytes(16).toString('hex');
  const url = `${req.protocol}://${req.get('host')}/phone?token=${token}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        to: email,
        subject: 'MyLink: Connect Your Phone',
        html: `<h3>Click to connect:</h3><a href="${url}">${url}</a>`
      });
      res.send('Email sent! Check inbox.');
    } catch (err) {
      console.error('Email error:', err);
      res.send('Email failed — check app password.');
    }
  } else {
    res.send(`Link ready: <a href="${url}">${url}</a>`);
  }
});

// WebRTC
io.on('connection', (socket) => {
  socket.on('offer', (data) => socket.broadcast.emit('offer', data));
  socket.on('answer', (data) => socket.broadcast.emit('answer', data));
  socket.on('ice', (data) => socket.broadcast.emit('ice', data));
});

// Render port fix
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MyLink running on port ${PORT}`);
});
