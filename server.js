require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const app = express();

// 中間件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 創建 Azure OpenAI 客戶端
const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin' && password === 'admin111') {
    res.redirect('/chat');
  } else {
    res.status(401).send('登入失敗，請檢查您的用戶名和密碼。');
  }
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.post('/chat', async (req, res) => {
  const { messages, sessionId } = req.body;
  try {
    const events = await client.streamChatCompletions(
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages,
      { maxTokens: 4096 }
    );

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked'
    });

    let botResponse = '';
    for await (const event of events) {
      if (event.choices && event.choices[0] && event.choices[0].delta && event.choices[0].delta.content) {
        const content = event.choices[0].delta.content;
        botResponse += content;
        res.write(content);
      }
    }

    res.end();
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '發生錯誤，請稍後再試。' });
    }
  }
});

// 添加新的路由來開始新的對話
app.post('/new-chat', async (req, res) => {
  const sessionId = Date.now().toString();
  res.json({ sessionId });
});

// 添加一個測試路由來檢查 Azure OpenAI 連接
app.get('/test-azure', async (req, res) => {
  try {
    const response = await client.getChatCompletions(
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      [{ role: "user", content: "Hello" }],
      { maxTokens: 10 }
    );
    res.json({ status: 'success', message: 'Azure OpenAI 連接成功' });
  } catch (error) {
    console.error('Azure OpenAI 測試錯誤:', error);
    res.status(500).json({ status: 'error', message: 'Azure OpenAI 連接問題', error: error.message });
  }
});

// 導出 app 以供 Vercel 使用
module.exports = app;
