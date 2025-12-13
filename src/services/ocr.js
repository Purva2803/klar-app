import { createWorker } from 'tesseract.js';

async function extractTextWithOpenAI(imageFile) {
  try {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageFile);
    });

    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64 })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.text || null;
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
        const contrast = 1.5;
        const adjusted = ((gray - 128) * contrast) + 128;
        const final = Math.max(0, Math.min(255, adjusted));
        data[i] = final;
        data[i + 1] = final;
        data[i + 2] = final;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

function cleanOCRText(text) {
  if (!text) return '';

  let cleaned = text.replace(/[|\[\]{}()=+\-_—`~]/g, ' ');
  cleaned = cleaned.replace(/\s\s+/g, ' ').trim();

  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 2) return false;
    return /[a-zA-Z가-힣]/.test(trimmedLine);
  });

  let finalCleaned = filteredLines.join(' ').replace(/[^a-zA-Z가-힣0-9\s.,!?'"&]/g, '');
  finalCleaned = finalCleaned.replace(/\s\s+/g, ' ').trim();

  return finalCleaned;
}

export async function performOCR(imageFile) {
  if (!imageFile) {
    throw new Error('No image file provided for OCR.');
  }

  // Try OpenAI Vision first (via serverless API)
  const openAIResult = await extractTextWithOpenAI(imageFile);
  if (openAIResult && openAIResult.length > 10) {
    return openAIResult;
  }

  // Fallback to Tesseract
  try {
    const processedImage = await preprocessImage(imageFile);
    const worker = await createWorker('eng+kor+jpn+chi_sim+spa+fra+deu+ara+tha+vie+ind');

    let ret = await worker.recognize(processedImage);
    let text = ret.data.text?.trim() || '';

    if (text.length < 10) {
      ret = await worker.recognize(imageFile);
      text = ret.data.text?.trim() || '';
    }

    await worker.terminate();

    if (!text) {
      throw new Error('No text detected in the image.');
    }

    const cleanedText = cleanOCRText(text);

    if (!cleanedText || cleanedText === '') {
      throw new Error('No meaningful text was detected. Please try a clearer image.');
    }

    return cleanedText;
  } catch (error) {
    if (error.message.includes('Tesseract')) {
      throw new Error('OCR failed. Please try a different image.');
    }
    throw error;
  }
}
