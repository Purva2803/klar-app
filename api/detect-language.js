export default async function handler(req, res) {
  console.log('[detect-language] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[detect-language] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const LINGO_API_KEY = process.env.LINGO_API_KEY || process.env.VITE_LINGO_API_KEY;
  console.log('[detect-language] API key configured:', !!LINGO_API_KEY);

  if (!LINGO_API_KEY) {
    console.log('[detect-language] Missing API key');
    return res.status(500).json({ error: 'Lingo API key not configured' });
  }

  try {
    const { text } = req.body;
    console.log('[detect-language] Text received:', text?.substring(0, 100));

    if (!text) {
      console.log('[detect-language] No text provided');
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use Lingo.dev API to detect language
    const { LingoDotDevEngine } = await import('lingo.dev/sdk');
    const lingoDotDev = new LingoDotDevEngine({ apiKey: LINGO_API_KEY });
    
    console.log('[detect-language] Calling Lingo API...');
    const locale = await lingoDotDev.recognizeLocale({ content: text });
    console.log('[detect-language] Detected locale:', locale);

    return res.status(200).json({ locale });
  } catch (error) {
    console.error('[detect-language] Error:', error.message);
    return res.status(503).json({ error: 'Language detection failed', details: error.message });
  }
}

