function ResultsDisplay({ extractedText, translatedText, productInfo, detectedLanguage }) {
  const getLanguageName = (code) => {
    if (!code) return '';
    const languageNames = {
      en: 'English',
      ko: 'Korean',
      ja: 'Japanese',
      zh: 'Chinese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
    };
    return languageNames[code] || code.toUpperCase();
  };
  
  const languageName = getLanguageName(detectedLanguage);
  const insights = productInfo?.insights;
  const product = productInfo?.product;

  const renderInsights = () => {
    if (!insights || (!insights.skinTypes.length && !insights.benefits.length)) return null;

    return (
      <div className="result-card">
        <h2>Product Insights</h2>
        <div className="result-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {insights.skinTypes.length > 0 && (
            <div className="product-detail">
              <strong>Good for Skin Types:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {insights.skinTypes.map(type => (
                  <span key={type} className="insight-tag skin-type">{type}</span>
                ))}
              </div>
            </div>
          )}
          {insights.benefits.length > 0 && (
            <div className="product-detail">
              <strong>Key Benefits:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {insights.benefits.map(benefit => (
                  <span key={benefit} className="insight-tag benefit">{benefit}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProductInfo = () => {
    if (!product) {
      return (
        <div className="result-card">
          <h2>No Product Found</h2>
          <div className="result-content">
            <div className="product-detail">
              <strong>Search Term Used:</strong>
              <p><em>"{translatedText || extractedText}"</em></p>
            </div>
            <p>No relevant product was found. Try uploading a clearer image with a visible product name.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="result-card">
        <h2>Information</h2>
        <div className="result-content">
          <div className="product-item">
            <div className="product-detail">
              <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                {product.title || 'Product'}
              </strong>
            </div>
            {product.description && (
              <div className="product-detail" style={{ marginTop: '0.5rem' }}>
                <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{product.description}</p>
              </div>
            )}
            {product.url && (
              <div className="product-detail" style={{ marginTop: '0.75rem' }}>
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="product-link"
                >
                  View Product →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="results-section">
      {extractedText && (
        <div className="result-card">
          <h2>{`Extracted Text`}</h2>
          <div className="result-content">
            <p style={{ whiteSpace: 'pre-wrap' }}>{extractedText}</p>
          </div>
        </div>
      )}
      {translatedText && detectedLanguage !== 'en' && (
        <div className="result-card">
          <h2>Translation (English)</h2>
          <div className="result-content">
            <p style={{ whiteSpace: 'pre-wrap' }}>{translatedText}</p>
          </div>
        </div>
      )}
      {renderInsights()}
      {renderProductInfo()}
    </div>
  );
}

export default ResultsDisplay;
