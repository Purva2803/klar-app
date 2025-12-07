import { useState } from 'react';
import './index.css';

import ImageUploader from './components/ImageUploader';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';

import { performOCR } from './services/ocr';
import { translateText, detectLanguage } from './services/translation';
import { getProductInfo } from './services/apify';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [productInfo, setProductInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);

  const handleImageUpload = (file) => {
    setSelectedImage(file);
    setError(null);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setExtractedText('');
    setDetectedLanguage(null);
    setTranslatedText('');
    setProductInfo(null);
    setError(null);
  };

  const handleAnalysis = async () => {
    if (!selectedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedText('');
    setDetectedLanguage(null);
    setTranslatedText('');
    setProductInfo(null);

    try {
      setLoadingText('Extracting text from image...');
      const ocrText = await performOCR(selectedImage);
      setExtractedText(ocrText);

      setLoadingText('Detecting language...');
      const lang = await detectLanguage(ocrText);
      setDetectedLanguage(lang);

      setLoadingText('Translating to English...');
      const englishText = await translateText(ocrText, lang);
      setTranslatedText(englishText);
      
      setLoadingText('Searching for product information...');
      const productData = await getProductInfo(englishText || ocrText);
      setProductInfo(productData);

    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Klar </h1>
        <p>Scan any skincare product & get instant insights</p>
      </header>

      <main>
        <ImageUploader 
          onImageUpload={handleImageUpload} 
          isLoading={isLoading} 
          onClear={handleClear} 
        />
        <button className="analyze-btn" onClick={handleAnalysis} disabled={!selectedImage || isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze Product'}
        </button>

        {isLoading && <LoadingSpinner loadingText={loadingText} />}

        {error && (
            <div className="error-display result-card">
                <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', padding: '16px', borderRadius: '8px' }}>
                    <strong style={{ color: '#721c24' }}>Oops! Something went wrong.</strong>
                    <p style={{ color: '#721c24', marginTop: '8px' }}>{error}</p>
                </div>
            </div>
        )}
        
        {!isLoading && !error && (productInfo || extractedText) && (
          <ResultsDisplay 
            extractedText={extractedText}
            translatedText={translatedText}
            productInfo={productInfo}
            detectedLanguage={detectedLanguage}
          />
        )}

      </main>

    </div>
  );
}

export default App;
