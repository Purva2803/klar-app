const IS_DEV = window.location.hostname === 'localhost';
const BACKEND_URL = '';

async function myMemoryFallback(text, sourceLang) {
  if (!text) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=${sourceLang}|en`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch {
    return null;
  }
  return null;
}

function detectLanguageFromChars(text) {
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0590-\u05ff]/.test(text)) return 'he';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  if (/[\u0370-\u03ff]/.test(text)) return 'el';
  if (/[ăâđêôơưàảãạáằẳẵặắầẩẫậấ]/.test(text.toLowerCase())) return 'vi';
  if (/[¿¡ñ]/.test(text.toLowerCase())) return 'es';
  if (/[àâçéèêëîïôùûü]/.test(text.toLowerCase()) && /\b(le|la|les|de|du|et)\b/i.test(text)) return 'fr';
  if (/[äöüß]/.test(text.toLowerCase())) return 'de';
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

export async function translateText(text, sourceLanguage) {
  if (!text) return "";
  const sourceLang = sourceLanguage || 'en';

  if (sourceLang === 'en' && isLikelyEnglish(text)) {
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
          targetLocale: 'en'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translation) return data.translation;
      }
    } catch {
      // Fall through
    }
  }

  const translation = await myMemoryFallback(text, sourceLang);
  if (translation) return translation;

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
