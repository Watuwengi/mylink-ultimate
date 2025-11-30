const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(__dirname, 'public', 'phone.html')));

app.get('/send', async (req, res) => {
  const input = (req.query.target || '').trim();
  const link = `${req.protocol}://${req.get('host')}/phone?t=${Date.now()}`;

  // Always show link on laptop
  res.send(`
    <h2 style="color:#0ff">LINK READY!</h2>
    <a href="${link}" style="color:#0f9;font-size:120%">${link}</a>
    <p style="color:#888;margin-top:20px">Sending SMS...</p>
  `);

  // === AUTO SEND SMS VIA GMAIL (FREE) ===
  if (input && process.env.GMAIL_PASS) {
    try {
      const nodemailer = require('nodemailer');

      // Clean the number
      let num = input.replace(/\D/g, '');           // remove everything except digits
      if (num.startsWith('0')) num = '254' + num.slice(1);
      if (num.startsWith('254')) num = num.slice(3);     // now 71xxxxxxxxx or 73xxxxxxxxx etc.

      // Choose correct gateway
      let gateway = '@safaricom.co.ke';
      if (num.startsWith('73') || num.startsWith('78')) gateway = '@airtelkenya.com';
      if (num.startsWith('77')) gateway = '@sms.telkom.co.ke';

      const smsTo = num + gateway;

      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'emmanuelwamb107@gmail.com',
          pass: process.env.GMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: 'MyLink',
        to: smsTo,
        text: link
      });

      console.log('SMS sent to', smsTo);
    } catch (e) {
      console.log('SMS failed (link still works):', e.message);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MyLink Ultimate + SMS WORKING'));
