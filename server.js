import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import QRCode from 'qrcode';

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;

  try {
    if (!process.env.API_KEY) {
      console.error('API key not found. Make sure to set the API_KEY environment variable.');
      return res.status(500).json({ error: 'API key not configured on the server.' });
    }
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response) {
        return res.status(500).json({ error: 'No response from Gemini API' });
    }

    const text = response.candidates[0].content.parts[0].text;
    res.json({ text });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: 'Failed to generate content', details: error.message });
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
