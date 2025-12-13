import { createWorker } from 'tesseract.js';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

async function extractWithOpenAI(imageFile) {
  if (!OPENAI_API_KEY) return null;

  try {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageFile);
    });

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
              text: `You are analyzing a skincare/beauty product image. Extract ALL text you can see.

IMPORTANT:
- Read and TRANSLATE any Korean (한글), Japanese (日本語), or Chinese (中文) text to English
- Korean characters like 자몽 = Grapefruit, 수분 = Moisture, 크림 = Cream, 핸드크림 = Hand Cream
- Look at the product TYPE (tube, jar, bottle) to guess what it is (hand cream, face cream, serum, etc.)
- Include the brand name prominently displayed

Return in this EXACT format:
[Brand Name] [Product Name in English] [Size if visible]

Example outputs:
- "The Face Shop Grapefruit Hand Cream 50ml"
- "LANEIGE Water Sleeping Mask 70ml"
- "COSRX Snail Mucin Essence 100ml"

Just return the product name, nothing else. No explanations.`
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' }
            }
          ]
        }],
        max_tokens: 100
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.choices[0]?.message?.content?.trim() || null;
    
    if (result && !result.toLowerCase().includes('not visible') && !result.toLowerCase().includes('cannot')) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

async function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const adjusted = ((gray - 128) * 1.5) + 128;
        const final = Math.max(0, Math.min(255, adjusted));
        data[i] = data[i + 1] = data[i + 2] = final;
      }
      
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}

function cleanOCRText(text) {
  if (!text) return '';
  let cleaned = text.replace(/[|\[\]{}()=+\-_—`~]/g, ' ').replace(/\s\s+/g, ' ').trim();
  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length >= 2 && /[a-zA-Z가-힣]/.test(trimmed);
  });
  return lines.join(' ').replace(/[^a-zA-Z가-힣0-9\s.,!?'"&]/g, '').replace(/\s\s+/g, ' ').trim();
}

async function tesseractFallback(imageFile) {
  const processedImage = await preprocessImage(imageFile);
  const worker = await createWorker('eng+kor+jpn+chi_sim');
  
  let ret = await worker.recognize(processedImage);
  let text = ret.data.text?.trim() || '';
  
  if (text.length < 10) {
    ret = await worker.recognize(imageFile);
    text = ret.data.text?.trim() || '';
  }
  
  await worker.terminate();
  return cleanOCRText(text);
}

export async function performOCR(imageFile) {
  if (!imageFile) throw new Error('No image file provided.');

  const openAIResult = await extractWithOpenAI(imageFile);
  if (openAIResult && openAIResult.length > 5) {
    return openAIResult;
  }

  const tesseractResult = await tesseractFallback(imageFile);
  
  if (!tesseractResult) {
    throw new Error('No text detected. Try a clearer image.');
  }
  
  return tesseractResult;
}
