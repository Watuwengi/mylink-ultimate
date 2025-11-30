const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));
app.use('/files', express.static('uploads'));

// GMAIL SMTP (FREE FOREVER)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'emmanuelwamb107@gmail.com',  // ← YOUR GMAIL
    pass: 'abcd efgh ijkl mnop'         // ← YOUR 16-DIGIT APP PASSWORD
  }
});

// Kenyan carrier email-to-SMS gateways
const smsGateways = {
  safaricom: '@safaricom.co.ke',   // +2547... → number@safaricom.co.ke
  airtel:    '@airtelkenya.com',  // +25473... / +25478... → number@airtelkenya.com
  telkom:    '@sms.telkom.co.ke'   // +25477... → number@sms.telkom.co.ke
};

// SEND LINK — works with email OR phone number
app.get('/link', async (req, res) => {
  const target = req.query.target?.trim();
  if (!target) return res.send('<p style="color:red">Enter email or number</p>');

  const token = Date.now().toString(36);
  const link = `${req.protocol}://${req.get('host')}/phone?t=${token}`;

  let to = '';
  let isPhone = false;

  // Detect Kenyan phone number
  if (/^(\+254|0)[7][1,3,7,8]\d{8}$/.test(target)) {
    let number = target.replace(/\D/g, '');
    if (number.startsWith('0')) number = '254' + number.slice(1);
    if (number.startsWith('2547')) number = number.slice(3); // remove 254

    let gateway = '';
    if (number.startsWith('7') && (number[1] === '1' || number[1] === '2')) gateway = smsGateways.safaricom;
    else if (number.startsWith('73') || number.startsWith('78')) gateway = smsGateways.airtel;
    else if (number.startsWith('77')) gateway = smsGateways.telkom;

    if (gateway) {
      to = number + gateway;
      isPhone = true;
    }
  }

  // If not phone → treat as email
  if (!isPhone && target.includes('@')) to = target;

  if (!to) return res.send('<p style="color:red">Invalid email/number</p>');

  try {
    await transporter.sendMail({
      from: 'MyLink <emmanuelwamb107@gmail.com>',
      to: to,
      subject: isPhone ? '' : 'MyLink Ultimate - Connect Your Phone',
      text: `Connect now:\n${link}\n\nWorks on any phone. Tap and share screen.`,
      html: `<h2>MyLink Ultimate</h2><p>Tap to connect:</p><a href="${link}">${link}</a>`
    });

    res.send(`
      <p style="color:#00ff9d">
        ${isPhone ? 'SMS' : 'Email'} sent to <b>${target}</b>!
      </p>
      <p>Direct link: <a href="${link}">${link}</a></p>
    `);
  } catch (err) {
    res.send(`<p style="color:red">Failed: ${err.message}</p>`);
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));

io.on('connection', (socket) => console.log('Connected:', socket.id));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MyLink LIVE → https://mylink-ultimate.onrender.com`);
});
