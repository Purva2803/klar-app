export default async function handler(req, res) {
  console.log('[ocr] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[ocr] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  console.log('[ocr] API key configured:', !!OPENAI_API_KEY);

  if (!OPENAI_API_KEY) {
    console.log('[ocr] Missing OpenAI API key');
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { imageBase64 } = req.body;
    console.log('[ocr] Image base64 length:', imageBase64?.length);

    if (!imageBase64) {
      console.log('[ocr] No image provided');
      return res.status(400).json({ error: 'No image provided' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert in skincare products. Look at this image of a skincare product.
              
1. Identify the brand name.
2. Identify the product name/type. If it's in a foreign language (like Korean, Japanese, Chinese), translate it accurately to English.
3. Extract any other important details like size (e.g., 50ml, 1.68 fl. oz).
4. Consider the shape of the product (e.g., tube, jar, bottle) to infer product type if text is unclear.

Return ONLY the extracted text in a clean, searchable format, combining brand, product name, and details.
Example: "The Face Shop Grapefruit Hand Cream 50ml"
Example: "LANEIGE Water Sleeping Mask 70ml"

Be concise and accurate. If you cannot read something clearly, omit it.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }],
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    console.log('[ocr] Extracted text:', extractedText?.substring(0, 100));

    return res.status(200).json({ text: extractedText });
  } catch (error) {
    console.error('[ocr] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

