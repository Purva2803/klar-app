export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const APIFY_API_KEY = process.env.APIFY_API_KEY;
  const KLAR_ACTOR = process.env.KLAR_ACTOR || 'apify~google-search-scraper';
  const USE_CUSTOM_ACTOR = process.env.USE_CUSTOM_ACTOR === 'true';

  if (!APIFY_API_KEY) {
    return res.status(500).json({ error: 'Apify API key not configured' });
  }

  try {
    const { searchQuery } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ error: 'No search query provided' });
    }

    const actorId = USE_CUSTOM_ACTOR ? KLAR_ACTOR : 'apify~google-search-scraper';
    
    const runInput = USE_CUSTOM_ACTOR 
      ? { searchQuery, maxResults: 3 }
      : { queries: searchQuery + ' skincare product', maxPagesPerQuery: 1, resultsPerPage: 5 };

    // Start actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify(runInput)
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      return res.status(runResponse.status).json({ error });
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Poll for results
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
      });

      const statusData = await statusResponse.json();

      if (statusData.data.status === 'SUCCEEDED') {
        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`,
          { headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` } }
        );
        const results = await datasetResponse.json();
        
        // Parse results
        const parsed = USE_CUSTOM_ACTOR 
          ? parseKlarResults(results)
          : parseGoogleResults(results);
        
        return res.status(200).json(parsed);
      } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED_OUT') {
        return res.status(500).json({ error: `Actor run failed: ${statusData.data.status}` });
      }
    }

    return res.status(504).json({ error: 'Timeout waiting for results' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function parseKlarResults(results) {
  if (!results || results.length === 0) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }

  const topResult = results[0];
  const allSkinTypes = new Set();
  const allBenefits = new Set();

  results.forEach(result => {
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
  const socialMediaDomains = [
    'instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com',
    'pinterest.com', 'youtube.com', 'linkedin.com', 'reddit.com', 'quora.com',
    'wikipedia.org', 'wikihow.com'
  ];

  const productResults = organicResults.filter(result =>
    result.url &&
    !socialMediaDomains.some(domain => result.url.includes(domain)) &&
    !result.url.includes('forum.') &&
    !result.url.includes('community.')
  );

  if (productResults.length === 0) {
    return { product: null, insights: { skinTypes: [], benefits: [] } };
  }

  const topResult = productResults[0];
  const allDescriptions = productResults.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();

  return {
    product: {
      title: topResult.title,
      description: topResult.description,
      url: topResult.url
    },
    insights: extractInsights(allDescriptions)
  };
}

function extractInsights(text) {
  const skinTypeKeywords = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne-prone', 'all skin types', 'mature'];
  const benefitKeywords = ['hydration', 'hydrating', 'moisture', 'moisturizing', 'brightening', 'anti-aging', 'firming', 'soothing', 'calming'];

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

  return { skinTypes: [...foundSkinTypes], benefits: [...foundBenefits] };
}

