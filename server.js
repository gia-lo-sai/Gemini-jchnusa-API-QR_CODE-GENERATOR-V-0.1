import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import QRCode from 'qrcode';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;

  try {
    const genAI = new GoogleGenAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('An error occurred:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to generate content', details: error });
  }
});

app.post('/api/qrcode', async (req, res) => {
  const { text } = req.body;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text);
    res.json({ qrCodeDataUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
