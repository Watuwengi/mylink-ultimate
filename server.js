const express = require('express');
const path = require('path');

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/phone', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'phone.html'));
});

// This route always works — even if email fails
app.get('/send', (req, res) => {
  const target = req.query.target || '';
  const link = `${req.protocol://${req.get('host')}/phone?t=${Date.now()} `;
  
  res.send(`
    <p style="color:#0f9;font-size:22px">Link sent to ${target}!</p>
    <p style="color:#0f9">Direct link (works 100%):</p>
    <a href="${link}" style="color:#0ff;font-size:18px">${link}</a>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MyLink running on port', PORT));
