# Klar Skincare Scraper

A custom Apify Actor that searches Google for skincare products, scrapes detailed product information, and translates results to any language using Lingo.dev.

## What it does

1. **Searches Google** for your product query + "skincare"
2. **Filters URLs** - removes social media, forums, and irrelevant sites
3. **Prioritizes trusted domains** - Amazon, Sephora, Ulta, etc.
4. **Scrapes product pages** - extracts title, description, ingredients, and more
5. **Translates results** - uses Lingo.dev to translate to Hindi, Spanish, French, etc.
6. **Returns structured data** - ready to use in your app

## Input

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `searchQuery` | string | Yes | - | Product name or search term |
| `maxResults` | integer | No | 1 | Number of product pages to scrape (1-10) |
| `targetLanguage` | string | No | en | Language code (en, hi, es, fr, de, etc.) |
| `lingoApiKey` | string | No | - | Lingo.dev API key (required for non-English) |

### Example Input

```json
{
    "searchQuery": "LANEIGE Water Sleeping Mask",
    "maxResults": 1,
    "targetLanguage": "hi",
    "lingoApiKey": "your_lingo_api_key"
}
```

## Output

The Actor saves results to the default dataset. Each item contains:

```json
{
    "url": "https://www.sephora.com/product/...",
    "title": "LANEIGE Water Sleeping Mask",
    "description": "एक हाइड्रेटिंग ओवरनाइट मास्क...",
    "descriptionOriginal": "A hydrating overnight mask...",
    "ingredients": "Water, Glycerin, Propanediol...",
    "howToUse": "शाम की स्किनकेयर के अंतिम चरण में लगाएं...",
    "howToUseOriginal": "Apply as the last step of your evening skincare...",
    "skinTypes": ["dry", "combination", "normal"],
    "benefits": ["hydrating", "moisturizing", "soothing"],
    "price": "$34.00",
    "targetLanguage": "hi",
    "scrapedAt": "2024-12-14T08:00:00.000Z"
}
```

## Smart Hybrid Translation

The scraper uses a smart approach for translation:

| Field | Translated? | Reason |
|-------|-------------|--------|
| Title | No | Brand names should stay recognizable |
| Description | Yes | Helpful for users |
| Ingredients | No | Scientific names are universal |
| How to Use | Yes | Instructions should be in user's language |

## Supported Languages

- English (en), Hindi (hi), Spanish (es), French (fr), German (de)
- Portuguese (pt), Italian (it), Korean (ko), Japanese (ja), Chinese (zh)
- Arabic (ar), Russian (ru), Thai (th), Vietnamese (vi), Indonesian (id)
- Turkish (tr), Dutch (nl), Polish (pl), Bengali (bn), Tamil (ta), Telugu (te)

## Trusted Domains

The scraper prioritizes these fast, reliable domains:

- **Major Retailers**: Amazon, Target, Walmart
- **Beauty Retailers**: Sephora, Ulta, Dermstore, Skinstore
- **K-Beauty**: YesStyle, Sokoglam, The Face Shop, Innisfree, Laneige
- **Department Stores**: Nordstrom, Macy's, Bloomingdale's

## Performance

| Setting | Value | Purpose |
|---------|-------|---------|
| Navigation Timeout | 15s | Fail fast on slow sites |
| Request Timeout | 30s | Don't wait forever |
| Max Retries | 1 | Move on quickly |
| Default Results | 1 | Speed over volume |

**Typical runtime**: 20-40 seconds for 1 result (+ translation time)

## Usage

### Run via API

```bash
curl -X POST "https://api.apify.com/v2/acts/YOUR_USERNAME~klar-skincare-scraper/runs?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "The Face Shop Rice Cream",
    "targetLanguage": "hi",
    "lingoApiKey": "your_lingo_api_key"
  }'
```

### Run via Apify Console

1. Go to [Apify Console](https://console.apify.com)
2. Find "klar-skincare-scraper" in your Actors
3. Click "Start" and enter your search query

### Run locally

```bash
cd actor
npm install
npx apify run -p '{"searchQuery": "COSRX Snail Mucin", "targetLanguage": "hi", "lingoApiKey": "your_key"}'
```

## Development

### Project Structure

```
actor/
├── .actor/
│   ├── actor.json        # Actor configuration
│   ├── Dockerfile        # Container definition
│   └── input_schema.json # Input validation
├── src/
│   └── main.js           # Main scraper logic with Lingo.dev
├── package.json
└── README.md
```

### Deploy to Apify

```bash
cd actor
npx apify login
npx apify push
```

## Tech Stack

- **[Crawlee](https://crawlee.dev)** - Web scraping framework
- **[Playwright](https://playwright.dev)** - Browser automation
- **[Apify SDK](https://docs.apify.com/sdk/js)** - Actor framework
- **[Lingo.dev](https://lingo.dev)** - AI-powered translation
