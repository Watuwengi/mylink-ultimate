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

app.get('/send', (req, res) => {
  const link = `${req.protocol}://${req.get('host')}/phone?t=${Date.now()}`;
  res.send(`
    <p style="color:#0f9;font-size:24px">Link ready!</p>
    <a href="${link}" style="color:#0ff;font-size:20px">${link}</a>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MyLink LIVE'));
