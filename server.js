const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const twilio = require('twilio');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Static files
app.use(express.static('public'));
app.use('/files', express.static('uploads'));
const upload = multer({ dest: 'uploads/' });

// Twilio Client (your number: +14406932146)
let client = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
}

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));

// SEND MAGIC LINK VIA SMS (Kenya-ready)
app.get('/link', async (req, res) => {
  const target = req.query.target?.trim();
  if (!target) return res.send('<p style="color:red">Enter number</p>');

  const token = Date.now().toString(36);
  const link = `${req.protocol}://${req.get('host')}/phone?t=${token}`;

  let sent = false;
  if (target && client && process.env.TWILIO_NUMBER) {
    const to = target.startsWith('0') ? '+254' + target.slice(1) : target;
    try {
      await client.messages.create({
        body: `MyLink Ultimate\nConnect your phone now:\n${link}`,
        from: process.env.TWILIO_NUMBER,  // +14406932146
        to: to
      });
      sent = true;
    } catch (e) {
      console.error("SMS failed:", e.message);
    }
  }

  res.send(sent 
    ? `<p style="color:#00ff9d">SMS sent to ${target}!</p>`
    : `<p style="color:#ff3366">SMS failed. Check Twilio secrets.</p><p>Direct link: <a href="${link}">${link}</a></p>`
  );
});

// File upload from laptop
app.post('/upload', upload.array('files'), (req, res) => {
  const files = req.files.map(f => ({
    name: f.originalname,
    path: `/files/${f.filename}`
  }));
  io.emit('newfiles', files);
  res.send('Uploaded!');
});

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MyLink Ultimate LIVE → https://your-app.onrender.com`);
});
