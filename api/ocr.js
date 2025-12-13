export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
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

    return res.status(200).json({ text: extractedText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

