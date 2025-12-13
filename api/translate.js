export default async function handler(req, res) {
  console.log('[translate] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[translate] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const LINGO_API_KEY = process.env.LINGO_API_KEY || process.env.VITE_LINGO_API_KEY;
  console.log('[translate] API key configured:', !!LINGO_API_KEY);

  if (!LINGO_API_KEY) {
    console.log('[translate] Missing API key');
    return res.status(500).json({ error: 'Lingo API key not configured' });
  }

  try {
    const { text, sourceLocale, targetLocale } = req.body;
    console.log('[translate] Request body:', { 
      textLength: text?.length, 
      sourceLocale, 
      targetLocale 
    });

    if (!text || !sourceLocale || !targetLocale) {
      console.log('[translate] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: text, sourceLocale, targetLocale' });
    }

    // Use Lingo.dev API to translate
    const { LingoDotDevEngine } = await import('lingo.dev/sdk');
    const lingoDotDev = new LingoDotDevEngine({ apiKey: LINGO_API_KEY });
    
    console.log('[translate] Calling Lingo API...');
    const translation = await lingoDotDev.localizeText({
      content: text,
      sourceLocale,
      targetLocale,
    });
    console.log('[translate] Translation complete, length:', translation?.length);

    return res.status(200).json({ translation });
  } catch (error) {
    console.error('[translate] Error:', error.message);
    return res.status(503).json({ error: 'Translation failed', details: error.message });
  }
}

