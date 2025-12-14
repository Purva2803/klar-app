const IS_DEV = window.location.hostname === 'localhost';
const BACKEND_URL = '';

// Supported languages for translation
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' }
];

async function myMemoryFallback(text, sourceLang, targetLang = 'en') {
  if (!text) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=${sourceLang}|${targetLang}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.responseData && data.responseData.translatedText) {
      const translated = data.responseData.translatedText;
      // Check for MyMemory error responses (rate limit, etc.)
      if (translated.includes('PLEASE SELECT') || 
          translated.includes('MYMEMORY WARNING') ||
          translated.includes('QUERY LENGTH LIMIT')) {
        console.warn('MyMemory rate limited, using original text');
        return null;
      }
      return translated;
    }
  } catch {
    return null;
  }
  return null;
}

function detectLanguageFromChars(text) {
  // Hindi (Devanagari script)
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  // Korean
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  // Japanese (Hiragana + Katakana)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  // Chinese
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  // Thai
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
  // Arabic
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  // Hebrew
  if (/[\u0590-\u05ff]/.test(text)) return 'he';
  // Russian (Cyrillic)
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  // Greek
  if (/[\u0370-\u03ff]/.test(text)) return 'el';
  // Bengali
  if (/[\u0980-\u09ff]/.test(text)) return 'bn';
  // Tamil
  if (/[\u0b80-\u0bff]/.test(text)) return 'ta';
  // Telugu
  if (/[\u0c00-\u0c7f]/.test(text)) return 'te';
  // Vietnamese
  if (/[ăâđêôơưàảãạáằẳẵặắầẩẫậấ]/.test(text.toLowerCase())) return 'vi';
  // Spanish
  if (/[¿¡ñ]/.test(text.toLowerCase())) return 'es';
  // French
  if (/[àâçéèêëîïôùûü]/.test(text.toLowerCase()) && /\b(le|la|les|de|du|et)\b/i.test(text)) return 'fr';
  // German
  if (/[äöüß]/.test(text.toLowerCase())) return 'de';
  // Portuguese
  if (/[ãõç]/.test(text.toLowerCase())) return 'pt';
  return 'en';
}

export async function detectLanguage(text) {
  if (!text) return 'en';
  
  if (!IS_DEV) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.locale) return data.locale;
      }
    } catch {
      // Fall through
    }
  }
  
  return detectLanguageFromChars(text);
}

function isLikelyEnglish(text) {
  const englishChars = text.match(/[a-zA-Z]/g) || [];
  const nonEnglishChars = text.replace(/[a-zA-Z\s.,!?'"&0-9]/g, '').length;
  return englishChars.length > text.length * 0.7 && nonEnglishChars < 5;
}

export async function translateText(text, sourceLanguage, targetLanguage = 'en') {
  if (!text) return "";
  const sourceLang = sourceLanguage || 'en';
  const targetLang = targetLanguage || 'en';

  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // If already in target language
  if (targetLang === 'en' && sourceLang === 'en' && isLikelyEnglish(text)) {
    return text;
  }

  if (!IS_DEV) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLocale: sourceLang,
          targetLocale: targetLang
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translation) {
          return data.translation;
        }
      }
    } catch {
      // Fall through
    }
  }

  const translation = await myMemoryFallback(text, sourceLang, targetLang);
  if (translation) {
    return translation;
  }

  return text;
}

export function getLanguageName(code) {
  const languages = {
    en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Chinese',
    'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
    th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
    ar: 'Arabic', he: 'Hebrew', ru: 'Russian', uk: 'Ukrainian',
    el: 'Greek', es: 'Spanish', fr: 'French', de: 'German',
    it: 'Italian', pt: 'Portuguese', nl: 'Dutch', pl: 'Polish',
    tr: 'Turkish', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil',
    te: 'Telugu', sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish'
  };
  return languages[code] || code?.toUpperCase() || 'Unknown';
}
