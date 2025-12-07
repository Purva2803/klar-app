import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { LingoDotDevEngine } from 'lingo.dev/sdk';

const app = express();
app.use(cors());
app.use(express.json());

const lingoDotDev = new LingoDotDevEngine({
    apiKey: process.env.LINGO_API_KEY,
});

app.post('/api/detect-language', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    try {
        const locale = await lingoDotDev.recognizeLocale({ content: text });
        res.json({ locale: locale });
    } catch (error) {
        console.error('Language detection error:', error.message);
        res.status(503).json({ error: `Server error: ${error.message}` });
    }
});

app.post('/api/translate', async (req, res) => {
    const { text, sourceLocale, targetLocale } = req.body;
    if (!text || !sourceLocale || !targetLocale) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const translation = await lingoDotDev.localizeText({
            content: text,
            sourceLocale: sourceLocale,
            targetLocale: targetLocale,
        });
        res.json({ translation });
    } catch (error) {
        console.error('Translation error:', error.message);
        res.status(503).json({ error: `Server error: ${error.message}` });
    }
});

export default app;

