import { getLanguageName } from '../services/translation';
import { analyzeIngredients } from '../data/ingredients';

import skinCareIcon from '../assets/skin-care.png';
import beautyIcon from '../assets/beauty.png';
import perfumeIcon from '../assets/perfume-spray.png';

function ResultsDisplay({ extractedText, translatedText, productInfo, detectedLanguage, isLoadingProduct }) {
  const languageName = getLanguageName(detectedLanguage);
  const insights = productInfo?.insights;
  const product = productInfo?.product;
  const ingredientAnalysis = analyzeIngredients(product?.ingredients || product?.description || '');

  const renderIngredientSafety = () => {
    if (!ingredientAnalysis) return null;
    
    return (
      <div className="result-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={perfumeIcon} alt="" style={{ width: '24px', height: '24px' }} />
          Ingredient Safety
        </h2>
        <div className="result-content">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '1rem',
            padding: '12px 16px',
            background: `${ingredientAnalysis.color}15`,
            borderRadius: '10px',
            border: `1px solid ${ingredientAnalysis.color}30`
          }}>
            <span style={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              {ingredientAnalysis.score === 'Clean' ? 'SAFE' : 
               ingredientAnalysis.score === 'Generally Safe' ? 'OK' : 'WARN'}
            </span>
            <div>
              <strong style={{ color: ingredientAnalysis.color, fontSize: '1.1rem' }}>
                {ingredientAnalysis.score}
              </strong>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>
                {ingredientAnalysis.good.length} beneficial • {ingredientAnalysis.caution.length} caution • {ingredientAnalysis.bad.length} avoid
              </p>
            </div>
          </div>

          {ingredientAnalysis.good.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#22c55e', fontSize: '0.9rem' }}>Good Ingredients</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {ingredientAnalysis.good.map(item => (
                  <span key={item.name} style={{
                    background: '#22c55e15',
                    color: '#16a34a',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    border: '1px solid #22c55e30'
                  }} title={item.benefit}>
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ingredientAnalysis.caution.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Use with Caution</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {ingredientAnalysis.caution.map(item => (
                  <span key={item.name} style={{
                    background: '#f59e0b15',
                    color: '#d97706',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    border: '1px solid #f59e0b30'
                  }} title={item.reason}>
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ingredientAnalysis.bad.length > 0 && (
            <div>
              <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>Ingredients to Avoid</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {ingredientAnalysis.bad.map(item => (
                  <span key={item.name} style={{
                    background: '#ef444415',
                    color: '#dc2626',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    border: '1px solid #ef444430'
                  }} title={item.reason}>
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (isLoadingProduct) {
      return (
        <div className="result-card">
          <h2>Product Insights</h2>
          <div className="result-content">
            <div className="product-loading">
              <div className="loading-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <p style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>
                Analyzing skin types & benefits...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!insights || (!insights.skinTypes.length && !insights.benefits.length)) return null;

    return (
      <div className="result-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={skinCareIcon} alt="" style={{ width: '24px', height: '24px' }} />
          Product Insights
        </h2>
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
    if (isLoadingProduct) {
      return (
        <div className="result-card">
          <h2>Product Details</h2>
          <div className="result-content">
            <div className="product-loading">
              <div className="loading-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <p style={{ marginTop: '1rem', opacity: 0.7 }}>
                Searching product information...
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '0.5rem' }}>
                This may take 30-60 seconds
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!product) {
      return (
        <div className="result-card">
          <h2>No Product Found</h2>
          <div className="result-content">
            <div className="product-detail">
              <strong>Search Term Used:</strong>
              <p><em>"{translatedText || extractedText}"</em></p>
            </div>
            <p>No relevant product was found. Try uploading a clearer image.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="result-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={beautyIcon} alt="" style={{ width: '24px', height: '24px' }} />
          Product Details
        </h2>
        <div className="result-content">
          <div className="product-item">
            <div className="product-detail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <strong style={{ color: 'var(--primary)', fontSize: '1.3rem', flex: 1 }}>
                {product.title || 'Product'}
              </strong>
              {product.price && (
                <span style={{ 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
                  color: 'white', 
                  padding: '6px 16px', 
                  borderRadius: '20px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(167, 139, 250, 0.3)'
                }}>
                  {product.price}
                </span>
              )}
            </div>

            {product.description && (
              <div className="product-detail" style={{ marginTop: '1rem' }}>
                <strong>About:</strong>
                <p style={{ opacity: 0.85, fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                  {product.description}
                </p>
              </div>
            )}

            {(product.howToUse || product.title) && (
              <div className="product-detail" style={{ marginTop: '1rem' }}>
                <strong>How to Use:</strong>
                <p style={{ opacity: 0.85, fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                  {product.howToUse || (
                    product.title.toLowerCase().includes('hand') 
                      ? 'Apply to clean, dry hands. Massage until absorbed. Reapply as needed.'
                      : product.title.toLowerCase().includes('serum')
                      ? 'Apply 2-3 drops to face after cleansing. Pat until absorbed. Follow with moisturizer.'
                      : product.title.toLowerCase().includes('mask')
                      ? 'Apply to clean face. Leave for recommended time or overnight. Rinse if needed.'
                      : product.title.toLowerCase().includes('cleanser')
                      ? 'Apply to damp skin. Massage gently. Rinse with lukewarm water.'
                      : 'Apply to clean skin as directed. Use as part of your daily routine.'
                  )}
                </p>
              </div>
            )}

            {product.url && (
              <div className="product-detail" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
                  }}
                >
                  View Product
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
          <h2>Detected Product</h2>
          <div className="result-content">
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{extractedText}</p>
          </div>
        </div>
      )}
      {translatedText && detectedLanguage !== 'en' && (
        <div className="result-card">
          <h2>Translation ({languageName})</h2>
          <div className="result-content">
            <p>{translatedText}</p>
          </div>
        </div>
      )}
      {renderInsights()}
      {renderIngredientSafety()}
      {renderProductInfo()}
    </div>
  );
}

export default ResultsDisplay;
