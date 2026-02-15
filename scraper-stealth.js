const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const products = [
  // CPUs
  { url: 'https://altex.ro/procesor-amd-ryzen-5-5600-3-5ghz-4-4ghz-socket-am4-100-100000927box/', category: 'cpu', store: 'Altex' },
  { url: 'https://altex.ro/procesor-amd-ryzen-5-5600x-3-7ghz-4-6ghz-socket-am4-100-100000065box/', category: 'cpu', store: 'Altex' },
  { url: 'https://www.vexio.ro/procesoare/amd/2726599-ryzen-5-5600-3-50ghz-socket-am4-tray-fara-cooler/', category: 'cpu', store: 'Vexio' },
  // Laptops
  { url: 'https://altex.ro/laptop-hp-probook-450-g9-intel-core-i5-1235u-pana-la-4-4ghz-15-6-full-hd-8gb-ssd-512gb-intel-uhd-graphics-windows-11-pro-argintiu/', category: 'laptop', store: 'Altex' },
  { url: 'https://altex.ro/laptop-asus-vivobook-go-15-l1504fa-bq611-amd-ryzen-5-7520u-pana-la-4-3ghz-15-6-full-hd-8gb-ssd-512gb-amd-radeon-610m-free-dos-mixed-black/', category: 'laptop', store: 'Altex' },
];

async function scrape() {
  console.log('🚀 Starting stealth scraper...');
  
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
      
      // Set realistic viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Add random delay to appear more human
      const delay = Math.random() * 2000 + 1000;
      console.log(`  ⏳ Waiting ${Math.round(delay)}ms...`);
      await new Promise(r => setTimeout(r, delay));
      
      await page.goto(p.url, { 
        waitUntil: 'networkidle2',
        timeout: 45000 
      });

      // Wait for price to appear (Altex loads it dynamically)
      try {
        await page.waitForSelector('[data-price], .price, .ProductPrice', { timeout: 10000 });
      } catch (e) {
        console.log('  ⚠ Price element not found, trying anyway...');
      }
      
      // Extra wait for lazy-loaded content
      await new Promise(r => setTimeout(r, 5000));

      const result = await page.evaluate(() => {
        // Debug: log all price-like elements
        const allText = Array.from(document.querySelectorAll('*'))
          .filter(el => el.innerText && (el.innerText.includes('lei') || el.className.toLowerCase().includes('price')))
          .map(el => ({ class: el.className, text: el.innerText.substring(0, 50) }))
          .slice(0, 10);
        console.log('Price-like elements:', JSON.stringify(allText));
        
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

        return {
          title: getText(['h1', '[data-product-name]', '.product-title', '.product-name']),
          price: getText(['[data-price]', '.price', '.product-price', '.Price', '.actual-price']),
          originalPrice: getText(['.old-price', '.original-price', '[data-old-price]', '.strikethrough']),
          imageUrl: getAttr(['.product-image img', '.gallery img', 'img[class*="product"]', '[data-main-image]'], 'src') 
            || document.querySelector('meta[property="og:image"]')?.content || ''
        };
      });

      console.log(`  ✓ Title: ${result.title ? result.title.substring(0, 40) + '...' : 'NOT FOUND'}`);
      console.log(`  ✓ Price: ${result.price || 'NOT FOUND'}`);
      console.log(`  ✓ Image: ${result.imageUrl ? 'FOUND' : 'NOT FOUND'}`);

      deals.push({
        id: String(i + 1),
        title: result.title,
        price: result.price,
        originalPrice: result.originalPrice,
        store: p.store,
        category: p.category,
        imageUrl: result.imageUrl,
        url: p.url
      });

      await page.close();
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  await browser.close();

  const fs = require('fs');
  fs.writeFileSync('deals-stealth.json', JSON.stringify(deals, null, 2));
  console.log(`\n✅ Saved ${deals.length} deals to deals-stealth.json`);
}

scrape();
