const APIFY_API_KEY = import.meta.env.VITE_APIFY_API_KEY;
const KLAR_ACTOR = import.meta.env.VITE_KLAR_ACTOR || 'apify~google-search-scraper';
const USE_CUSTOM_ACTOR = import.meta.env.VITE_USE_CUSTOM_ACTOR === 'true';

const BLOCKED_DOMAINS = [
  'reddit.com', 'quora.com', 'community.', 'forum.',
  'instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com',
  'pinterest.com', 'youtube.com', 'youtu.be',
  'linkedin.com', 'tumblr.com', 'snapchat.com',
  'wikipedia.org', 'wikihow.com',
  'amazon.com/review', 'trustpilot.com'
];

function isBlockedUrl(url) {
  if (!url) return true;
  return BLOCKED_DOMAINS.some(domain => url.toLowerCase().includes(domain));
}

async function waitForApifyResults(runId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
      throw new Error(`Actor run failed: ${data.data.status}`);
    }
  }
  
  throw new Error('Timeout waiting for results');
}

function parseKlarResults(results) {
  if (!results || results.length === 0) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }

  const validResults = results.filter(r => !isBlockedUrl(r.url));
  
  if (validResults.length === 0) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }

  const topResult = validResults[0];
  
  const allSkinTypes = new Set();
  const allBenefits = new Set();
  
  validResults.forEach(result => {
    (result.skinTypes || []).forEach(st => allSkinTypes.add(st));
    (result.benefits || []).forEach(b => allBenefits.add(b));
  });

  return {
    product: {
      title: topResult.title,
      description: topResult.description,
      url: topResult.url,
      ingredients: topResult.ingredients || '',
      howToUse: topResult.howToUse || '',
      price: topResult.price || ''
    },
    insights: {
      skinTypes: [...allSkinTypes],
      benefits: [...allBenefits]
    }
  };
}

function parseGoogleResults(results) {
  if (!results || results.length === 0 || !results[0].organicResults) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }
  
  const organicResults = results[0].organicResults || [];
  const productResults = organicResults.filter(result => !isBlockedUrl(result.url));
  
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
    insights
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
    if (text.includes(keyword)) foundSkinTypes.add(keyword);
  });

  benefitKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      foundBenefits.add(keyword === 'moisture' || keyword === 'moisturizing' ? 'hydrating' : keyword);
    }
  });

  return {
    skinTypes: [...foundSkinTypes],
    benefits: [...foundBenefits]
  };
}

async function runKlarActor(searchQuery) {
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/${KLAR_ACTOR}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({ searchQuery, maxResults: 3 })
    });

    if (!response.ok) throw new Error(`API failed: ${response.status}`);

    const data = await response.json();
    const results = await waitForApifyResults(data.data.id);
    return parseKlarResults(results);
  } catch {
    return await runGoogleSearchActor(searchQuery);
  }
}

async function runGoogleSearchActor(searchQuery) {
  const response = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${APIFY_API_KEY}`
    },
    body: JSON.stringify({
      queries: searchQuery + ' skincare product',
      maxPagesPerQuery: 1,
      resultsPerPage: 5
    })
  });

  if (!response.ok) throw new Error(`API failed: ${response.status}`);

  const data = await response.json();
  const results = await waitForApifyResults(data.data.id);
  return parseGoogleResults(results);
}

export async function getProductInfo(productName) {
  if (!APIFY_API_KEY || APIFY_API_KEY === 'YOUR_APIFY_API_KEY') {
    throw new Error("Apify API key not configured.");
  }

  let cleanedText = productName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\b[a-zA-Z]\b/g, '')
    .replace(/\b\d{1,2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const brandPatterns = [
    'LANEIGE', 'Rare Beauty', 'Fenty', 'Charlotte Tilbury', 'NARS', 'MAC', 
    'Urban Decay', 'Too Faced', 'Benefit', 'Tatcha', 'Drunk Elephant', 
    'Glossier', 'Sol de Janeiro', 'The Face Shop', 'Innisfree', 'COSRX',
    'Cetaphil', 'CeraVe', 'La Roche', 'Neutrogena', 'Olay', 'SK-II',
    'Clinique', 'Estee Lauder', 'Shiseido', 'Origins', 'Kiehl', 'Fresh',
    'Sunday Riley', 'Paula', 'The Ordinary', 'Glow Recipe', 'Supergoop'
  ];
  
  const foundBrand = brandPatterns.find(brand => 
    productName.toUpperCase().includes(brand.toUpperCase())
  );
  
  let searchTerm = '';
  
  if (foundBrand) {
    const words = cleanedText.split(' ').filter(w => w.length > 2);
    searchTerm = foundBrand + ' ' + words.slice(0, 5).join(' ');
  } else {
    const words = cleanedText.split(' ').filter(w => w.length > 3);
    searchTerm = words.slice(0, 6).join(' ');
  }
  
  if (searchTerm.length < 10) {
    searchTerm = cleanedText.substring(0, 60);
  }

  if (USE_CUSTOM_ACTOR) {
    return await runKlarActor(searchTerm);
  }
  return await runGoogleSearchActor(searchTerm);
}
