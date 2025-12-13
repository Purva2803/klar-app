# Klar - AI-Powered Skincare Scanner

Scan any skincare product from anywhere in the world. Klar uses AI to read product labels (even in Korean, Japanese, or Chinese), translates them, finds product information, and analyzes ingredient safety.

## Features

- **AI-Powered OCR**: Uses OpenAI GPT-4 Vision to accurately read product labels
- **Multi-Language Support**: Detects and translates 30+ languages using lingo.dev
- **Smart Product Search**: Custom Apify actor scrapes real product pages
- **Ingredient Safety Scanner**: Analyzes ingredients and flags concerns
- **PWA Ready**: Installable on mobile devices

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| OCR | OpenAI GPT-4 Vision + Tesseract.js |
| Translation | lingo.dev |
| Web Scraping | Apify (Custom Actor) |
| Backend | Vercel Serverless |

## Quick Start

### 1. Install

```bash
git clone <repo-url>
cd scanz
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_OPENAI_API_KEY=sk-...
VITE_LINGO_API_KEY=api_...
LINGO_API_KEY=api_...
VITE_APIFY_API_KEY=apify_api_...
VITE_KLAR_ACTOR=your-username~klar-product-scraper
VITE_USE_CUSTOM_ACTOR=true
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
scanz/
├── src/
│   ├── components/       # React components
│   ├── services/         # API integrations (OCR, translation, Apify)
│   └── data/             # Ingredient database
├── api/                  # Vercel serverless functions
└── actor/                # Apify actor source code
```

## Deployment

```bash
# Frontend
npm run build && vercel deploy

# Actor
cd actor && npx apify-cli login && npx apify-cli push
```

## API Keys

| Service | Link |
|---------|------|
| OpenAI | https://platform.openai.com/api-keys |
| lingo.dev | https://lingo.dev/dashboard |
| Apify | https://console.apify.com/account/integrations |

## Custom Apify Actor

The project includes a custom Apify actor for scraping product details. After deploying, view it on Apify Console:

https://console.apify.com/actors

## License

MIT

---

Built using [Apify](https://apify.com) and [lingo.dev](https://lingo.dev)
