import { createWorker } from 'tesseract.js';

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

  try {
    const worker = await createWorker('eng+kor+jpn+chi_sim+spa+fra+deu');
    const ret = await worker.recognize(imageFile);
    await worker.terminate();
    
    const text = ret.data.text;
    if (!text) {
      throw new Error('Tesseract returned no text. The image might be empty or unreadable.');
    }

    const rawText = text.trim();
    const cleanedText = cleanOCRText(rawText);

    if (!cleanedText || cleanedText === '') {
      throw new Error('No meaningful text was detected in the image after cleaning. Please try a clearer image.');
    }
    return cleanedText;

  } catch (error) {
    console.error("Error during OCR process:", error);
    if (error.message.includes('Tesseract')) {
        throw new Error('The OCR engine failed to process the image. Please try a different image.');
    }
    throw error;
  }
}
