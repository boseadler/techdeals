const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Specific product URLs that we know work
const products = [
  // Cel.ro - CPUs
  { url: 'https://www.cel.ro/procesoare/', category: 'cpu', store: 'Cel.ro' },
  // Vexio - specific CPUs that work
  { url: 'https://www.vexio.ro/procesoare/amd/2726599-ryzen-5-5600-3-50ghz-socket-am4-tray-fara-cooler/', category: 'cpu', store: 'Vexio' },
  { url: 'https://www.vexio.ro/procesoare/amd/591901-ryzen-5-5600x-3-7-ghz-32-mb-l3-tray/', category: 'cpu', store: 'Vexio' },
];

async function scrape() {
  console.log('🚀 Starting scraper (Cel.ro + Vexio)...');
  
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
      
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
      
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise(r => setTimeout(r, 3000));

      const result = await page.evaluate((store) => {
        if (store === 'Cel.ro') {
          const data = [];
          const allDivs = Array.from(document.querySelectorAll('div'));
          const seen = new Set();
          
          allDivs.forEach(div => {
            const text = div.innerText || '';
            if (text.includes('lei') && (text.includes('AMD') || text.includes('Intel') || text.includes('Ryzen') || text.includes('Core'))) {
              const title = text.split('lei')[1]?.split('Adauga')[0]?.trim() || '';
              const priceMatch = text.match(/(\d+\.?\d*)\s*lei/);
              const price = priceMatch ? priceMatch[1] + ' lei' : '';
              
              if (title && price && !seen.has(title) && title.length > 5) {
                seen.add(title);
                const img = div.querySelector('img')?.src || '';
                data.push({ title, price, img });
              }
            }
          });
          return data.slice(0, 4);
        } else if (store === 'Vexio') {
          const allText = Array.from(document.querySelectorAll('*'))
            .filter(el => el.innerText && el.innerText.includes('lei') && el.innerText.match(/\d+\.?\d*\s*lei/))
            .map(el => el.innerText);
          
          let title = '';
          let price = '';
          let img = '';
          
          // Get title from h1
          const h1 = document.querySelector('h1')?.innerText?.trim() || '';
          if (h1) title = h1;
          
          // Find price text
          for (const text of allText) {
            const match = text.match(/Pret:\s*(\d+[.,]\d+)\s*lei/);
            if (match) {
              price = match[1].replace(',', '.') + ' lei';
              break;
            }
            // Alternative pattern
            const altMatch = text.match(/(\d+[.,]\d+)\s*lei/);
            if (altMatch && text.includes('Pret:')) {
              price = altMatch[1].replace(',', '.') + ' lei';
              break;
            }
          }
          
          // Get image
          img = document.querySelector('.product-image img, .gallery img, img[class*="product"]')?.src || '';
          
          if (title && price) {
            return [{ title, price, img }];
          }
          return [];
        }
        return [];
      }, p.store);

      console.log(`  ✓ Found ${result.length} products`);
      result.forEach(r => console.log(`    - ${r.title.substring(0, 30)}... ${r.price}`));

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
  fs.writeFileSync('deals.json', JSON.stringify(deals, null, 2));
  console.log(`\n✅ Saved ${deals.length} deals to deals.json`);
}

scrape();
