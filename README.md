# Klar - Skincare Scanner

Klar is a simple web tool that helps you understand skincare products from around the world. Just upload an image of a product, and it will extract the text, translate it if needed, and pull useful insights and links from the web.

It's designed to make sense of products with descriptions in languages you don't understand.

## Features

-   **Multi-Language OCR**: Uses Tesseract.js to extract text in English, Korean, Japanese, Chinese, Spanish, French, German, and more.
-   **Automatic Translation**: Detects the language and translates it to English.
-   **Product Insights**: Scans Google for at-a-glance info on skin types and benefits.
-   **Top Search Results**: Displays relevant product links from Google.
-   **Responsive Design**: A clean, modern UI for desktop and mobile.

## Tech Stack

-   **Frontend**: React (Vite)
-   **Backend**: Node.js / Express (deployed as a Vercel Serverless Function)
-   **OCR**: Tesseract.js
-   **Translation**: Lingo.dev SDK
-   **Product Data**: Apify (Google Search Scraper)
-   **Deployment**: Vercel

## How It Works

1.  **Upload**: The user uploads an image of a skincare product.
2.  **OCR**: Tesseract.js scans the image locally in the browser to extract any text. The text is cleaned to remove noise.
3.  **Language Detection & Translation**: The extracted text is sent to a serverless backend function.
    -   The backend uses the Lingo.dev API to detect the source language.
    -   If the text is not English, it's translated to English.
    -   The app includes a client-side heuristic to skip translation if the text is already likely English.
4.  **Product Search**: The translated (or original English) text is used as a query for the Apify Google Search Scraper.
5.  **Insight Extraction**: The app parses the titles and descriptions from the top Google search results to identify keywords related to skin types and benefits.
6.  **Display**: The final results, including the original text, translation, product insights, and top Google links, are displayed to the user.

## 🚀 Quick Start

### 1. Clone or Download

```bash
cd /Users/purva/scanz
```

### 2. Install Dependencies

You'll need Node.js (version 18 or higher) installed.

```bash
npm install
```

### 3. Configure API Keys

Create a `.env` file in the root of the project by copying the example:

```bash
cp .env.example .env
```

Now, open `.env` and add your API keys:

```
# Lingo.dev API Key
VITE_LINGO_API_KEY="your_lingo_api_key_here"

# Apify API Key
VITE_APIFY_API_KEY="your_apify_api_key_here"
VITE_APIFY_ACTOR_ID="getdataforme~sephora-scraper"
```

#### Where to get API keys:

-   **Lingo.dev**: [https://lingo.dev/dashboard](https://lingo.dev/dashboard)
-   **Apify**: [https://console.apify.com/account/integrations](https://console.apify.com/account/integrations)

### 4. Run the Development Server

```bash
npm run dev
```

The app will now be running at **http://localhost:5173**.

## 📋 How It Works

1.  **Upload Image**: The `ImageUploader` component handles the file selection.
2.  **State Update**: React state in the main `App` component is updated.
3.  **Analysis Triggered**: The `handleAnalysis` function orchestrates the following calls to service modules:
    -   `performOCR()`: Extracts text using Tesseract.js.
    -   `translateText()`: Translates the text using the `lingo.dev` SDK.
    -   `getProductInfo()`: Runs the Apify actor to get product data.
4.  **Display Results**: The UI re-renders reactively to show loading states, errors, or the final data in the `ResultsDisplay` component.

## 🔧 Configuration

### Apify Actors

The app is pre-configured to use the **Sephora Scraper**. You can change the `VITE_APIFY_ACTOR_ID` in your `.env` file to use a different actor.

-   **Sephora Scraper**: `getdataforme~sephora-scraper`
-   **Ulta Beauty Scraper**: `getdataforme~ulta-scraper`
-   **Google Shopping Scraper**: `apify/google-shopping-scraper`

### Translation Fallback

If the `VITE_LINGO_API_KEY` is missing or invalid, the application will automatically use a public LibreTranslate API as a fallback to ensure it remains functional.

## 📦 Project Structure

```
scanz/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable React components
│   │   ├── ImageUploader.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ResultsDisplay.jsx
│   ├── services/    # Modules for external APIs
│   │   ├── apify.js
│   │   ├── ocr.js
│   │   └── translation.js
│   ├── App.jsx      # Main application component
│   ├── index.css    # Global styles
│   └── main.jsx     # App entry point
├── .env.example     # Environment variable template
├── .gitignore
├── index.html       # Main HTML template for Vite
├── package.json
└── README.md
```

## 🎯 Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Bundles the app for production.
-   `npm run preview`: Serves the production build locally.

## 📄 License

MIT License - Feel free to use and modify!
