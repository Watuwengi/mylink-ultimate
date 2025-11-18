const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Gmail SMTP (use your 16-digit app password)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'emmanuelwamb107@gmail.com',           // ← YOUR GMAIL
    pass: process.env.GMAIL_PASS || 'abcd efgh ijkl mnop'  // ← 16-digit app password
  }
});

// Kenyan Email-to-SMS Gateways
const gateways = {
  safaricom: '@safaricom.co.ke',   // 0712... → 712xxx@safaricom.co.ke
  airtel:    '@airtelkenya.com',   // 073... / 078...
  telkom:    '@sms.telkom.co.ke'   // 077...
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));

app.get('/send', async (req, res) => {
  let input = (req.query.target || '').trim();
  if (!input) return res.send('<p style="color:red">Enter email or phone number</p>');

  const token = Date.now().toString(36);
  const link = `${req.protocol}://${req.get('host')}/phone?t=${token}`;

  let to = '';
  let type = '';

  // Detect Kenyan phone number
  if (/^(\+254|0)?[7][12378]\d{8}$/.test(input)) {
    let num = input.replace(/\D/g, '');
    if (num.startsWith('0')) num = '254' + num.slice(1);
    if (num.startsWith('254')) num = num.slice(3);

    let gateway = '';
    if (num.startsWith('71') || num.startsWith('72')) gateway = gateways.safaricom;
    else if (num.startsWith('73') || num.startsWith('78')) gateway = gateways.airtel;
    else if (num.startsWith('77')) gateway = gateways.telkom;

    if (gateway) {
      to = num + gateway;
      type = 'SMS';
    }
  }

  // If not phone → treat as email
  if (!to && input.includes('@')) {
    to = input;
    type = 'Email';
  }

  if (!to) return res.send('<p style="color:red">Invalid phone/email</p>');

  try {
    await transporter.sendMail({
      from: 'MyLink <emmanuelwamb107@gmail.com>',
      to: to,
      subject: type === 'SMS' ? '' : 'MyLink Ultimate',
      text: `Connect your phone now:\n${link}`,
      html: `<h3>MyLink Ultimate</h3><p>Tap to connect:</p><a href="${link}">${link}</a>`
    });

    res.send(`
      <p style="color:#00ff9d;font-size:18px">
        ${type} sent to <b>${input}</b> successfully!
      </p>
      <small>Direct: <a href="${link}">${link}</a></small>
    `);
  } catch (err) {
    res.send(`<p style="color:red">Failed: ${err.message}</p>`);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('MyLink LIVE'));
