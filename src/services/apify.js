const APIFY_API_KEY = import.meta.env.VITE_APIFY_API_KEY;
const GOOGLE_SEARCH_ACTOR = 'apify~google-search-scraper';

async function waitForApifyResults(runId, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
    });
    
    const data = await response.json();
    
    if (data.data.status === 'SUCCEEDED') {
      const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${data.data.defaultDatasetId}/items`, {
        headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
      });
      return await datasetResponse.json();
    } else if (data.data.status === 'FAILED' || data.data.status === 'TIMED_OUT') {
        throw new Error(`Apify actor run failed with status: ${data.data.status}`);
    }
  }
  
  throw new Error('Timeout waiting for Apify results');
}

function parseGoogleResults(results) {
  if (!results || results.length === 0 || !results[0].organicResults) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }
  
  const organicResults = results[0].organicResults || [];
  
  const productResults = organicResults.filter(result => 
    result.url && 
    !result.url.includes('reddit.com') &&
    !result.url.includes('quora.com') &&
    !result.url.includes('community.')
  );
  
  if (productResults.length === 0) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }

  const topResult = productResults[0];
  const allDescriptions = productResults.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();
  const insights = extractInsights(allDescriptions);

  return {
    product: {
      title: topResult.title,
      description: topResult.description,
      url: topResult.url,
    },
    insights: insights
  };
}

function extractInsights(text) {
    const skinTypeKeywords = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne-prone', 'all skin types', 'mature'];
    const benefitKeywords = [
        'hydration', 'hydrating', 'moisture', 'moisturizing', 'brightening', 'radiance',
        'anti-aging', 'wrinkles', 'firming', 'soothing', 'calming', 'redness',
        'pore minimizing', 'exfoliating', 'acne', 'blemishes', 'sun protection', 'spf'
    ];

    const foundSkinTypes = new Set();
    const foundBenefits = new Set();

    skinTypeKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            foundSkinTypes.add(keyword);
        }
    });

    benefitKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            if (keyword === 'moisture' || keyword === 'moisturizing') {
                foundBenefits.add('hydrating');
            } else {
                foundBenefits.add(keyword);
            }
        }
    });

    return {
        skinTypes: [...foundSkinTypes],
        benefits: [...foundBenefits]
    };
}


export async function getProductInfo(productName) {
  if (!APIFY_API_KEY || APIFY_API_KEY === 'YOUR_APIFY_API_KEY') {
    throw new Error("Apify API key is not configured. Please add it to your .env file.");
  }

  try {
    let searchTerm = productName.split('\n')[0].substring(0, 80).trim();
    
    const brandPatterns = ['LANEIGE', 'Rare Beauty', 'Fenty', 'Charlotte Tilbury', 'NARS', 'MAC', 'Urban Decay', 'Too Faced', 'Benefit', 'Tatcha', 'Drunk Elephant', 'Glossier', 'Sol de Janeiro'];
    let foundBrand = brandPatterns.find(brand => 
      productName.toUpperCase().includes(brand.toUpperCase())
    );
    
    if (foundBrand) {
      searchTerm = foundBrand + ' ' + searchTerm.replace(new RegExp(foundBrand, 'gi'), '').trim();
    }
    
    const searchQuery = `${searchTerm} skincare product`;

    const runInput = {
      "queries": searchQuery,
      "maxPagesPerQuery": 1,
      "resultsPerPage": 5
    };
    
    const response = await fetch(`https://api.apify.com/v2/acts/${GOOGLE_SEARCH_ACTOR}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify(runInput)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Apify API Error:", errorBody);
      throw new Error(`Apify API request failed with status ${response.status}.`);
    }

    const data = await response.json();
    
    const runId = data.data.id;
    const results = await waitForApifyResults(runId);
    
    const { product, insights } = parseGoogleResults(results);

    return { product, insights };

  } catch (error) {
    console.error('Product info error:', error);
    throw error;
  }
}
