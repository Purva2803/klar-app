import { useState } from 'react';
import './index.css';

import ImageUploader from './components/ImageUploader';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';

import { performOCR } from './services/ocr';
import { translateText, detectLanguage } from './services/translation';
import { getProductInfo } from './services/apify';

import logo from './assets/logo.png';
import skinCareIcon from './assets/skin-care.png';

function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleImagesUpload = (files) => {
    setSelectedImages(files);
    setError(null);
  };

  const handleClear = () => {
    setSelectedImages([]);
    setResults([]);
    setError(null);
    setCurrentIndex(0);
  };

  const handleAnalysis = async () => {
    if (selectedImages.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentIndex(0);

    const allResults = [];

    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      setCurrentIndex(i + 1);
      
      try {
        setLoadingText(`Image ${i + 1}/${selectedImages.length}: Extracting text...`);
        const ocrText = await performOCR(image);

        setLoadingText(`Image ${i + 1}/${selectedImages.length}: Detecting language...`);
        const lang = await detectLanguage(ocrText);

        setLoadingText(`Image ${i + 1}/${selectedImages.length}: Translating...`);
        const englishText = await translateText(ocrText, lang);
        
        // Show partial results while loading product info
        const partialResult = {
          extractedText: ocrText,
          detectedLanguage: lang,
          translatedText: englishText,
          productInfo: null,
          isLoadingProduct: true
        };
        allResults.push(partialResult);
        setResults([...allResults]);
        
        setIsLoading(false);
        setIsLoadingProduct(true);
        setLoadingText(`Image ${i + 1}/${selectedImages.length}: Searching product...`);
        
        const productData = await getProductInfo(englishText || ocrText);
        
        // Update with full result
        allResults[i] = {
          ...partialResult,
          productInfo: productData,
          isLoadingProduct: false
        };
        setResults([...allResults]);

      } catch (err) {
        allResults.push({
          extractedText: '',
          detectedLanguage: null,
          translatedText: '',
          productInfo: null,
          isLoadingProduct: false,
          error: err.message
        });
        setResults([...allResults]);
      }
    }

    setIsLoading(false);
    setIsLoadingProduct(false);
    setLoadingText('');
  };

  return (
    <div className="container">
      <header>
        <img src={logo} alt="Klar" style={{ width: '200px', height: 'auto', marginBottom: '8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <p style={{ margin: 0 }}>Scan any skincare product & get instant insights</p>
          <img src={skinCareIcon} alt="" style={{ width: '24px', height: '24px' }} />
        </div>
      </header>

      <main>
        <ImageUploader 
          onImagesUpload={handleImagesUpload} 
          isLoading={isLoading} 
          onClear={handleClear} 
        />
        <button className="analyze-btn" onClick={handleAnalysis} disabled={selectedImages.length === 0 || isLoading}>
          {isLoading ? `Analyzing ${currentIndex}/${selectedImages.length}...` : `Analyze ${selectedImages.length > 1 ? `${selectedImages.length} Products` : 'Product'}`}
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
        
        {results.map((result, index) => (
          <div key={index} style={{ marginTop: '2rem' }}>
            {results.length > 1 && (
              <h3 style={{ 
                color: 'var(--primary)', 
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--primary)'
              }}>
                Product {index + 1}
              </h3>
            )}
            {result.error ? (
              <div className="result-card">
                <div style={{ background: '#f8d7da', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: '#721c24' }}>Failed to analyze this image</strong>
                  <p style={{ color: '#721c24', marginTop: '8px' }}>{result.error}</p>
                </div>
              </div>
            ) : (
              <ResultsDisplay 
                extractedText={result.extractedText}
                translatedText={result.translatedText}
                productInfo={result.productInfo}
                detectedLanguage={result.detectedLanguage}
                isLoadingProduct={result.isLoadingProduct}
              />
            )}
          </div>
        ))}

      </main>

    </div>
  );
}

export default App;
