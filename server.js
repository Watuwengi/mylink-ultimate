const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));
app.use('/files', express.static(path.join(__dirname, 'uploads')));
const upload = multer({ dest: 'uploads/' });

// Twilio SMS (free trial → 100 SMS/month)
const twilio = require('twilio')(
  process.env.TWILIO_SID || 'YOUR_TWILIO_SID',
  process.env.TWILIO_TOKEN || 'YOUR_TWILIO_TOKEN'
);

const phones = new Map(); // token → phone data

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));
app.get('/qr', async (req, res) => {
  const token = req.query.t || Date.now().toString(36);
  const url = `${req.protocol}://${req.get('host')}/phone?t=${token}`;
  const qr = await qrcode.toDataURL(url);
  res.send(`<img src="${qr}" /><br><a href="${url}">${url}</a>`);
});

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;
  phones.set(token, { socket, online: true });
  socket.on('disconnect', () => phones.delete(token));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MYLINK ULTIMATE LIVE → https://mylink-ultimate.onrender.com`);
});
