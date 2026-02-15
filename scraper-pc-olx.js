const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const products = [
  // PC Garage - specific CPUs
  { url: 'https://www.pcgarage.ro/procesoare/amd/ryzen-5-5600/', category: 'cpu', store: 'PC Garage' },
  { url: 'https://www.pcgarage.ro/procesoare/amd/ryzen-5-5600x/', category: 'cpu', store: 'PC Garage' },
  { url: 'https://www.pcgarage.ro/procesoare/intel/core-i5-12400f/', category: 'cpu', store: 'PC Garage' },
  { url: 'https://www.pcgarage.ro/procesoare/intel/core-i5-12400/', category: 'cpu', store: 'PC Garage' },
  // OLX - specific search results for products
  { url: 'https://www.olx.ro/electronice-si-electrocasnice/q-procesor-amd-ryzen-5/', category: 'cpu', store: 'OLX' },
  { url: 'https://www.olx.ro/electronice-si-electrocasnice/q-procesor-intel-i5/', category: 'cpu', store: 'OLX' },
  { url: 'https://www.olx.ro/electronice-si-electrocasnice/q-laptop-gaming/', category: 'laptop', store: 'OLX' },
  { url: 'https://www.olx.ro/electronice-si-electrocasnice/q-laptop-lenovo/', category: 'laptop', store: 'OLX' },
];

async function scrape() {
  console.log('🚀 Starting PC Garage + OLX scraper...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const deals = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`\n[${i + 1}/${products.length}] ${p.store} - ${p.category}`);
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Random delay
      const delay = Math.random() * 2000 + 2000;
      await new Promise(r => setTimeout(r, delay));
      
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for content
      await new Promise(r => setTimeout(r, 4000));

      const result = await page.evaluate((store) => {
        const getText = (selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el.innerText.trim();
          }
          return '';
        };
        
        const getAttr = (selectors, attr) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el[attr]) return el[attr];
          }
          return '';
        };

        // For OLX - get first listing
        if (store === 'OLX') {
          const firstItem = document.querySelector('[data-cy="listing-card"], .listing-card, .offer');
          const title = firstItem?.querySelector('h3, .title, a')?.innerText?.trim() || '';
          const price = firstItem?.querySelector('[data-testid="price"]')?.innerText?.trim() || 
                       firstItem?.querySelector('.price')?.innerText?.trim() || 
                       firstItem?.querySelector('.price-tag')?.innerText?.trim() || '';
          const link = firstItem?.querySelector('a')?.href || '';
          const img = firstItem?.querySelector('img')?.src || '';
          
          return { title, price, imageUrl: img, link };
        }
        
        // For PC Garage
        return {
          title: getText(['h1', '.product-title', '.product-name']),
          price: getText(['.price', '.product-price', '.ProductPrice', '[data-price]']),
          imageUrl: getAttr(['.product-image img', '.gallery img'], 'src'),
          link: window.location.href
        };
      }, p.store);

      console.log(`  ✓ Title: ${result.title ? result.title.substring(0, 35) + '...' : 'NOT FOUND'}`);
      console.log(`  ✓ Price: ${result.price || 'NOT FOUND'}`);
      console.log(`  ✓ Image: ${result.imageUrl ? 'FOUND' : 'NOT FOUND'}`);

      if (result.title || result.price) {
        deals.push({
          id: String(deals.length + 1),
          title: result.title || '',
          price: result.price || '',
          store: p.store,
          category: p.category,
          imageUrl: result.imageUrl || '',
          url: result.link || p.url
        });
      }

      await page.close();
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  await browser.close();

  const fs = require('fs');
  fs.writeFileSync('deals-scraped.json', JSON.stringify(deals, null, 2));
  console.log(`\n✅ Saved ${deals.length} deals to deals-scraped.json`);
}

scrape();
