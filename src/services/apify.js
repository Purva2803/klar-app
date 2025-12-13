export async function getProductInfo(productName) {
  try {
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

    let foundBrand = brandPatterns.find(brand =>
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

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchQuery: searchTerm })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Search failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
