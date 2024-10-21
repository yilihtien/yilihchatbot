const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin111') {
    res.json({ success: true, redirect: '/chat' });
  } else {
    res.status(401).json({ success: false, message: '登入失敗，請檢查您的用戶名和密碼。' });
  }
});

module.exports = app;
