const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const products = [
  // Cel.ro CPUs
  { url: 'https://www.cel.ro/procesoare/', category: 'cpu', store: 'Cel.ro', selector: '.col-md-4' },
  // Vexio CPUs
  { url: 'https://www.vexio.ro/procesoare/amd/', category: 'cpu', store: 'Vexio' },
  { url: 'https://www.vexio.ro/procesoare/intel/', category: 'cpu', store: 'Vexio' },
];

async function scrape() {
  console.log('🚀 Starting multi-retailer scraper...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const deals = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`\n[${i + 1}/${products.length}] ${p.store}`);
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      const delay = Math.random() * 1500 + 1500;
      await new Promise(r => setTimeout(r, delay));
      
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise(r => setTimeout(r, 3000));

      const result = await page.evaluate((store) => {
        const data = [];
        
        if (store === 'Cel.ro') {
          // Cel.ro: find all divs with AMD/Intel + price
          const allDivs = Array.from(document.querySelectorAll('div'));
          const seen = new Set();
          
          allDivs.forEach(div => {
            const text = div.innerText || '';
            if (text.includes('lei') && (text.includes('AMD') || text.includes('Intel') || text.includes('Ryzen') || text.includes('Core'))) {
              const title = text.split('lei')[1]?.split('Adauga')[0]?.trim() || '';
              const priceMatch = text.match(/(\d+\.?\d*)\s*lei/);
              const price = priceMatch ? priceMatch[1] + ' lei' : '';
              
              if (title && price && !seen.has(title)) {
                seen.add(title);
                // Try to get image
                const img = div.querySelector('img')?.src || '';
                data.push({ title, price, img });
              }
            }
          });
        } else if (store === 'Vexio') {
          // Vexio: look for product items
          const items = Array.from(document.querySelectorAll('.product-item, .product-card, [class*="product"]'));
          items.forEach(item => {
            const title = item.querySelector('.product-name, h3, a')?.innerText?.trim() || '';
            const price = item.querySelector('.price, .product-price')?.innerText?.trim() || '';
            const img = item.querySelector('img')?.src || '';
            if (title && price) {
              data.push({ title, price, img });
            }
          });
        }
        
        return data.slice(0, 4); // Max 4 per store
      }, p.store);

      console.log(`  ✓ Found ${result.length} products`);
      result.forEach(r => console.log(`    - ${r.title.substring(0, 35)}... ${r.price}`));

      result.forEach(r => {
        deals.push({
          id: String(deals.length + 1),
          title: r.title,
          price: r.price,
          store: p.store,
          category: p.category,
          imageUrl: r.img || '',
          url: p.url
        });
      });

      await page.close();
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  await browser.close();

  const fs = require('fs');
  fs.writeFileSync('deals-multi.json', JSON.stringify(deals, null, 2));
  console.log(`\n✅ Saved ${deals.length} deals to deals-multi.json`);
}

scrape();
