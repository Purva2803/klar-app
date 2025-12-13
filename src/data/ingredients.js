export const INGREDIENT_DATABASE = {
  bad: [
    { name: 'paraben', reason: 'Potential hormone disruptor' },
    { name: 'sulfate', reason: 'Can strip natural oils, irritate skin' },
    { name: 'phthalate', reason: 'Potential hormone disruptor' },
    { name: 'formaldehyde', reason: 'Known carcinogen' },
    { name: 'triclosan', reason: 'Potential hormone disruptor' },
    { name: 'oxybenzone', reason: 'Hormone disruption concerns' },
    { name: 'hydroquinone', reason: 'Can cause skin sensitivity' },
    { name: 'coal tar', reason: 'Potential carcinogen' },
    { name: 'mineral oil', reason: 'Can clog pores' },
  ],
  caution: [
    { name: 'fragrance', reason: 'May cause irritation for sensitive skin' },
    { name: 'parfum', reason: 'May cause irritation for sensitive skin' },
    { name: 'alcohol denat', reason: 'Can be drying' },
    { name: 'retinol', reason: 'Can cause sensitivity, avoid sun exposure' },
    { name: 'aha', reason: 'Can cause sun sensitivity' },
    { name: 'bha', reason: 'Can cause sun sensitivity' },
    { name: 'glycolic acid', reason: 'Can cause sun sensitivity' },
    { name: 'salicylic acid', reason: 'Can be drying, sun sensitivity' },
  ],
  good: [
    { name: 'hyaluronic acid', benefit: 'Intense hydration' },
    { name: 'niacinamide', benefit: 'Brightening, pore minimizing' },
    { name: 'vitamin c', benefit: 'Antioxidant, brightening' },
    { name: 'ascorbic acid', benefit: 'Vitamin C, brightening' },
    { name: 'ceramide', benefit: 'Barrier repair' },
    { name: 'peptide', benefit: 'Anti-aging, firming' },
    { name: 'centella', benefit: 'Soothing, healing' },
    { name: 'cica', benefit: 'Soothing, healing' },
    { name: 'aloe', benefit: 'Soothing, hydrating' },
    { name: 'green tea', benefit: 'Antioxidant' },
    { name: 'squalane', benefit: 'Moisturizing, non-comedogenic' },
    { name: 'snail', benefit: 'Healing, hydrating' },
    { name: 'glycerin', benefit: 'Hydrating' },
    { name: 'shea butter', benefit: 'Moisturizing' },
    { name: 'jojoba', benefit: 'Balancing, moisturizing' },
  ]
};

export function analyzeIngredients(ingredientText) {
  if (!ingredientText) return null;
  
  const text = ingredientText.toLowerCase();
  const found = { good: [], caution: [], bad: [] };
  
  INGREDIENT_DATABASE.good.forEach(item => {
    if (text.includes(item.name)) found.good.push(item);
  });
  
  INGREDIENT_DATABASE.caution.forEach(item => {
    if (text.includes(item.name)) found.caution.push(item);
  });
  
  INGREDIENT_DATABASE.bad.forEach(item => {
    if (text.includes(item.name)) found.bad.push(item);
  });
  
  const total = found.good.length + found.caution.length + found.bad.length;
  if (total === 0) return null;
  
  let score = 'Clean';
  let color = '#22c55e';
  
  if (found.bad.length > 0) {
    score = 'Concerns Found';
    color = '#ef4444';
  } else if (found.caution.length > 0) {
    score = 'Generally Safe';
    color = '#f59e0b';
  }
  
  return { ...found, score, color };
}

