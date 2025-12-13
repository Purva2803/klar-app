import { PlaywrightCrawler, Dataset, createPlaywrightRouter } from '@crawlee/playwright';
import { Actor } from 'apify';

await Actor.init();

const { searchQuery, maxResults = 3 } = (await Actor.getInput()) ?? {};

if (!searchQuery) throw new Error('searchQuery is required');

const productUrls = [];
const router = createPlaywrightRouter();

router.addHandler('GOOGLE', async ({ page, log }) => {
    log.info('Parsing Google search results...');
    
    await page.waitForSelector('div#search', { timeout: 15000 }).catch(() => {});
    
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
    productUrls.push(...unique.slice(0, maxResults));
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
    requestHandlerTimeoutSecs: 60,
    navigationTimeoutSecs: 30,
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
