import { PlaywrightCrawler, Dataset, createPlaywrightRouter } from '@crawlee/playwright';
import { Actor } from 'apify';

await Actor.init();

const { searchQuery, maxResults = 1 } = (await Actor.getInput()) ?? {};

if (!searchQuery) throw new Error('searchQuery is required');

// Trusted domains that are fast and have good product data
const TRUSTED_DOMAINS = [
    'amazon.com', 'sephora.com', 'ulta.com', 'target.com', 'walmart.com',
    'dermstore.com', 'skinstore.com', 'cultbeauty.com', 'lookfantastic.com',
    'yesstyle.com', 'sokoglam.com', 'beautylish.com', 'nordstrom.com',
    'macys.com', 'bloomingdales.com', 'bergdorfgoodman.com', 'saksfifthavenue.com',
    'thefaceshop.com', 'innisfree.com', 'etudehouse.com', 'laneige.com',
    'cosrx.com', 'paula'
];

const productUrls = [];
const router = createPlaywrightRouter();

router.addHandler('GOOGLE', async ({ page, log }) => {
    log.info('Parsing Google search results...');
    
    await page.waitForSelector('div#search', { timeout: 10000 }).catch(() => {});
    
    const links = await page.$$eval('div#search a[href^="http"]', (anchors) => {
        const blocked = [
            'google.com', 'youtube.com', 'youtu.be', 'reddit.com', 'quora.com',
            'instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com',
            'pinterest.com', 'linkedin.com', 'tumblr.com', 'snapchat.com',
            'wikipedia.org', 'wikihow.com', 'forum.', 'community.'
        ];
        return anchors
            .map(a => a.href)
            .filter(href => href && !blocked.some(domain => href.includes(domain)));
    });
    
    const unique = [...new Set(links)];
    log.info(`Found ${unique.length} URLs`);
    
    // Prioritize trusted domains
    const trusted = unique.filter(url => 
        TRUSTED_DOMAINS.some(domain => url.toLowerCase().includes(domain))
    );
    const others = unique.filter(url => 
        !TRUSTED_DOMAINS.some(domain => url.toLowerCase().includes(domain))
    );
    
    // Take trusted first, then others
    const prioritized = [...trusted, ...others];
    log.info(`Prioritized: ${trusted.length} trusted, ${others.length} others`);
    
    productUrls.push(...prioritized.slice(0, maxResults));
});

router.addHandler('PRODUCT', async ({ request, page, log }) => {
    log.info(`Scraping: ${request.url}`);
    
    await page.waitForLoadState('domcontentloaded');
    
    const title = await page.title();
    const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
    const bodyText = await page.$eval('body', el => el.innerText.toLowerCase()).catch(() => '');
    
    let ingredients = '';
    const ingredientEl = await page.$('[class*="ingredient"], [id*="ingredient"]').catch(() => null);
    if (ingredientEl) {
        ingredients = await ingredientEl.innerText().catch(() => '');
        ingredients = ingredients.substring(0, 800);
    }
    
    let howToUse = '';
    const howToUseSelectors = [
        '[class*="how-to-use"]', '[class*="howToUse"]', '[class*="usage"]',
        '[class*="directions"]', '[id*="how-to-use"]', '[id*="usage"]', '[id*="directions"]'
    ];
    for (const selector of howToUseSelectors) {
        const el = await page.$(selector).catch(() => null);
        if (el) {
            const text = await el.innerText().catch(() => '');
            if (text && text.length > 20 && text.length < 1000) {
                howToUse = text.substring(0, 500);
                break;
            }
        }
    }
    
    const skinTypes = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'all skin types']
        .filter(k => bodyText.includes(k));
    
    const benefits = ['hydrating', 'moisturizing', 'brightening', 'anti-aging', 'soothing', 'calming', 'firming', 'nourishing', 'refreshing']
        .filter(k => bodyText.includes(k));
    
    const priceMatch = bodyText.match(/\$[\d,.]+/);
    const price = priceMatch ? priceMatch[0] : '';
    
    await Dataset.pushData({
        url: request.url,
        title: title.substring(0, 200),
        description: description.substring(0, 500),
        ingredients,
        howToUse,
        skinTypes: [...new Set(skinTypes)],
        benefits: [...new Set(benefits)],
        price,
        scrapedAt: new Date().toISOString()
    });
    
    log.info(`Done: ${title.substring(0, 40)}...`);
});

const proxyConfiguration = await Actor.createProxyConfiguration().catch(() => null);

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandlerTimeoutSecs: 30,  // Reduced from 60
    navigationTimeoutSecs: 15,       // Reduced from 30
    maxRequestRetries: 1,            // Only 1 retry instead of 3
    requestHandler: router,
    headless: true,
});

const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' skincare')}`;
await crawler.run([{ url: searchUrl, label: 'GOOGLE' }]);

if (productUrls.length > 0) {
    await crawler.run(productUrls.map(url => ({ url, label: 'PRODUCT' })));
}

const dataset = await Dataset.open();
const { items } = await dataset.getData();

await Actor.setValue('OUTPUT', {
    searchQuery,
    totalResults: items.length,
    products: items
});

await Actor.exit();
