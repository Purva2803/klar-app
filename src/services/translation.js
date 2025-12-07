const BACKEND_URL = '';

async function myMemoryFallback(text, sourceLang) {
    if (!text) return "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|en`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`MyMemory API failed with status: ${response.status}`);
        }
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
    } catch (error) {
        console.warn('MyMemory fallback failed:', error.message);
        return null;
    }
}

export async function detectLanguage(text) {
  const koreanChars = text.match(/[\uac00-\ud7af]/g);
  if (koreanChars && koreanChars.length > 5) {
      return 'ko';
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/detect-language`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Status: ${response.status}`);
    }
    const data = await response.json();
    return data.locale || 'ko';
  } catch (error) {
    console.error("Language detection failed:", error.message);
    console.warn("Defaulting to 'ko'");
    return 'ko';
  }
}

function isLikelyEnglish(text) {
    const englishChars = text.match(/[a-zA-Z]/g) || [];
    const nonEnglishChars = text.replace(/[a-zA-Z\s.,!?'"&]/g, '').length;
    
    return englishChars.length > text.length * 0.7 && nonEnglishChars < 5;
}

export async function translateText(text, sourceLanguage) {
  if (!text) return "";
  const sourceLang = sourceLanguage || 'ko';

  if (sourceLang === 'en' && isLikelyEnglish(text)) {
    return text;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLocale: sourceLang,
        targetLocale: 'en'
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Status: ${response.status}`);
    }
    const data = await response.json();
    if (data.translation) {
      return data.translation;
    }
    throw new Error("Empty result from API");
  } catch (error) {
    console.warn('Backend translation failed:', error.message);
  }

  let translation = await myMemoryFallback(text, sourceLang);
  if (translation) {
    return translation;
  }

  console.warn("All translation services failed. Returning original text.");
  return text;
}

