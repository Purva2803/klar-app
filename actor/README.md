# Klar Product Scraper 🧴

A custom Apify Actor that searches Google for skincare products and scrapes detailed product information from the result pages.

## What it does

1. **Searches Google** for your product query + "skincare"
2. **Filters URLs** - removes social media, forums, and irrelevant sites
3. **Prioritizes trusted domains** - Amazon, Sephora, Ulta, etc.
4. **Scrapes product pages** - extracts title, description, ingredients, and more
5. **Returns structured data** - ready to use in your app

## Input

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `searchQuery` | string | ✅ | - | Product name or search term |
| `maxResults` | integer | ❌ | 1 | Number of product pages to scrape (1-10) |

### Example Input

```json
{
    "searchQuery": "LANEIGE Water Sleeping Mask",
    "maxResults": 1
}
```

## Output

The Actor saves results to the default dataset. Each item contains:

```json
{
    "url": "https://www.sephora.com/product/...",
    "title": "LANEIGE Water Sleeping Mask",
    "description": "A hydrating overnight mask...",
    "ingredients": "Water, Glycerin, Propanediol...",
    "howToUse": "Apply as the last step of your evening skincare...",
    "skinTypes": ["dry", "combination", "normal"],
    "benefits": ["hydrating", "moisturizing", "soothing"],
    "price": "$34.00",
    "scrapedAt": "2024-12-13T13:00:00.000Z"
}
```

## Trusted Domains

The scraper prioritizes these fast, reliable domains:

- **Major Retailers**: Amazon, Target, Walmart
- **Beauty Retailers**: Sephora, Ulta, Dermstore, Skinstore
- **K-Beauty**: YesStyle, Sokoglam, The Face Shop, Innisfree, Laneige
- **Department Stores**: Nordstrom, Macy's, Bloomingdale's

## Blocked Domains

These are automatically filtered out:

- Social Media: Instagram, TikTok, Facebook, Twitter, Pinterest, YouTube
- Forums: Reddit, Quora, community sites
- Reference: Wikipedia, WikiHow

## Performance

| Setting | Value | Purpose |
|---------|-------|---------|
| Navigation Timeout | 15s | Fail fast on slow sites |
| Request Timeout | 30s | Don't wait forever |
| Max Retries | 1 | Move on quickly |
| Default Results | 1 | Speed over volume |

**Typical runtime**: 20-40 seconds for 1 result

## Usage

### Run via API

```bash
curl -X POST "https://api.apify.com/v2/acts/YOUR_USERNAME~klar-product-scraper/runs?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"searchQuery": "The Face Shop Rice Cream"}'
```

### Run via Apify Console

1. Go to [Apify Console](https://console.apify.com)
2. Find "klar-product-scraper" in your Actors
3. Click "Start" and enter your search query

### Run locally

```bash
cd actor
npm install
npx apify run -p '{"searchQuery": "COSRX Snail Mucin"}'
```

## Development

### Project Structure

```
actor/
├── .actor/
│   ├── actor.json        # Actor configuration
│   ├── Dockerfile         # Container definition
│   └── input_schema.json  # Input validation
├── src/
│   └── main.js            # Main scraper logic
├── package.json
└── README.md
```

### Deploy to Apify

```bash
cd actor
npx apify login
npx apify push
```

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  1. GOOGLE SEARCH                                           │
│     └── Search: "LANEIGE Water Sleeping Mask skincare"     │
│     └── Extract URLs from results                           │
│     └── Filter out social media, forums                     │
│     └── Prioritize trusted domains (Sephora, Amazon...)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. PRODUCT PAGE SCRAPING                                   │
│     └── Visit top URL (e.g., sephora.com/product/...)      │
│     └── Extract: title, description, ingredients           │
│     └── Find: skinTypes, benefits, price                   │
│     └── Save to Dataset                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. OUTPUT                                                  │
│     └── Structured JSON with all product data              │
│     └── Ready for your Klar app!                           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **[Crawlee](https://crawlee.dev)** - Web scraping framework
- **[Playwright](https://playwright.dev)** - Browser automation
- **[Apify SDK](https://docs.apify.com/sdk/js)** - Actor framework

## License

ISC

