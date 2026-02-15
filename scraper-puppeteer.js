const puppeteer = require('puppeteer');

// Helper function to wait (replaces deprecated page.waitForTimeout)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extended product list with more CPUs and laptops
const products = [
  // CPUs - Altex
  { url: 'https://altex.ro/procesor-amd-ryzen-5-5600-3-5ghz-4-4ghz-socket-am4-100-100000927box/', category: 'cpu', store: 'Altex' },
  { url: 'https://altex.ro/procesor-amd-ryzen-5-5600x-3-7ghz-4-6ghz-socket-am4-100-100000065box/', category: 'cpu', store: 'Altex' },
  { url: 'https://altex.ro/procesor-amd-ryzen-7-5800x-3-8ghz-4-7ghz-socket-am4-100-100000064box/', category: 'cpu', store: 'Altex' },
  { url: 'https://altex.ro/procesor-intel-core-i5-12400f-2-5ghz-4-4ghz-socket-1700-100-100000465box/', category: 'cpu', store: 'Altex' },
  { url: 'https://altex.ro/procesor-intel-core-i5-12600k-3-7ghz-4-9ghz-socket-1700-100-100000061box/', category: 'cpu', store: 'Altex' },
  { url: 'https://altex.ro/procesor-amd-ryzen-9-5900x-3-7ghz-4-8ghz-socket-am4-100-100000063box/', category: 'cpu', store: 'Altex' },
  // CPUs - Vexio
  { url: 'https://www.vexio.ro/procesoare/amd/2726599-ryzen-5-5600-3-50ghz-socket-am4-tray-fara-cooler/', category: 'cpu', store: 'Vexio' },
  { url: 'https://www.vexio.ro/procesoare/amd/2726601-ryzen-7-5800x-3-80ghz-socket-am4-tray-fara-cooler/', category: 'cpu', store: 'Vexio' },
  { url: 'https://www.vexio.ro/procesoare/intel/2619405-core-i5-12400f-2-50ghz-socket-1700-tray/', category: 'cpu', store: 'Vexio' },
  // Laptops - Altex
  { url: 'https://altex.ro/laptop-hp-probook-450-g9-intel-core-i5-1235u-pana-la-4-4ghz-15-6-full-hd-8gb-ssd-512gb-intel-uhd-graphics-windows-11-pro-argintiu/', category: 'laptop', store: 'Altex' },
  { url: 'https://altex.ro/laptop-asus-vivobook-go-15-l1504fa-bq611-amd-ryzen-5-7520u-pana-la-4-3ghz-15-6-full-hd-8gb-ssd-512gb-amd-radeon-610m-free-dos-mixed-black/', category: 'laptop', store: 'Altex' },
  { url: 'https://altex.ro/laptop-lenovo-ideapad-3-15iau7-intel-core-i5-1235u-pana-la-4-4ghz-15-6-full-hd-8gb-ssd-512gb-intel-uhd-graphics-free-dos/', category: 'laptop', store: 'Altex' },
  { url: 'https://altex.ro/laptop-dell-vostro-3520-intel-core-i5-1235u-pana-la-4-4ghz-15-6-full-hd-16gb-ssd-512gb-intel-uhd-graphics-windows-11-pro/', category: 'laptop', store: 'Altex' },
  { url: 'https://altex.ro/laptop-asus-vivobook-15-x1504za-nj302w-amd-ryzen-3-7320u-pana-la-4-1ghz-15-6-full-hd-8gb-ssd-256gb-amd-radeon-610m-windows-11-silver/', category: 'laptop', store: 'Altex' },
  // Laptops - Vexio
  { url: 'https://www.vexio.ro/laptopuri/2886525-vivobook-15-x1504za-nj302w-amd-ryzen-3-7320u-15-6-fhd-8gb-256gb-win11/', category: 'laptop', store: 'Vexio' },
  { url: 'https://www.vexio.ro/laptopuri/2886526-vivobook-15-o1504za-bq074w-intel-core-i3-1215u-15-6-fhd-8gb-256gb-win11/', category: 'laptop', store: 'Vexio' },
];

// Improved selectors for Altex (dynamic classes)
const selectors = {
  Altex: {
    title: 'h1, [data-product-name], .product-title, h2',
    // Altex uses dynamic classes, so we look for price-related attributes/patterns
    price: '[data-price], .CurrentPrice, .price, [class*="Price"], .product-price, span.price-label',
    originalPrice: '[data-old-price], .old-price, .original-price, [class*="OldPrice"], del',
    image: '.product-image img, [data-main-image], .gallery img, img[class*="product"], .gallery-image img, meta[property="og:image"]',
  },
  Vexio: {
    title: 'h1, .product-title, [data-product-name], h2',
    price: '.price, .product-price, [data-price], .current-price, span[itemprop="price"]',
    originalPrice: '.old-price, .original-price, [data-old-price], del',
    image: '.product-image img, .gallery img, img.product-img, meta[property="og:image"]',
  }
};

async function scrapeProduct(browser, url, category, store) {
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for JS to render (replacing deprecated waitForTimeout)
    await wait(3000);
    
    const storeSelectors = selectors[store] || selectors.Altex;
    
    const result = await page.evaluate((sel) => {
      const data = { title: '', price: '', originalPrice: '', imageURL: '' };
      
      // Title
      const titleEl = document.querySelector(sel.title);
      if (titleEl) data.title = titleEl.innerText.trim();
      
      // Price - try multiple approaches for dynamic Altex classes
      const priceEl = document.querySelector(sel.price);
      if (priceEl) {
        data.price = priceEl.innerText.trim();
        // Also try data-price attribute
        if (!data.price && priceEl.dataset?.price) {
          data.price = priceEl.dataset.price;
        }
      }
      // Fallback: look for any element with price-like content
      if (!data.price) {
        const pricePatterns = document.querySelectorAll('[class*="price"], [class*="Price"]');
        for (const p of pricePatterns) {
          const text = p.innerText.trim();
          if (text.match(/[0-9]+[\s.,]*[0-9]*(lei|ron|€)/i)) {
            data.price = text;
            break;
          }
        }
      }
      
      // Original Price
      const origEl = document.querySelector(sel.originalPrice);
      if (origEl) {
        data.originalPrice = origEl.innerText.trim();
      }
      
      // Image
      let imgEl = document.querySelector(sel.image);
      if (imgEl) {
        data.imageURL = imgEl.src || imgEl.content;
      }
      // Fallback to OG image
      if (!data.imageURL) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) data.imageURL = ogImage.content;
      }
      
      return data;
    }, storeSelectors);
    
    return {
      url,
      category,
      store,
      ...result
    };
  } catch (err) {
    console.error(`  Error scraping ${url}: ${err.message}`);
    return { url, category, store, error: err.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Starting Puppeteer scraper...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const deals = [];
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`Scraping ${i + 1}/${products.length}: ${p.store} - ${p.category}`);
    
    const result = await scrapeProduct(browser, p.url, p.category, p.store);
    deals.push(result);
    
    console.log(`  Title: ${result.title?.substring(0, 50) || 'N/A'}...`);
    console.log(`  Price: ${result.price || 'N/A'}`);
    console.log(`  Image: ${result.imageURL ? 'Found' : 'Not found'}`);
    console.log('');
  }
  
  await browser.close();
  
  // Summary
  const withTitle = deals.filter(d => d.title).length;
  const withPrice = deals.filter(d => d.price).length;
  const withImage = deals.filter(d => d.imageURL).length;
  const errors = deals.filter(d => d.error).length;
  
  console.log('=== RESULTS ===');
  console.log(`Total products scraped: ${deals.length}`);
  console.log(`Products with title: ${withTitle}`);
  console.log(`Products with price: ${withPrice}`);
  console.log(`Products with image: ${withImage}`);
  console.log(`Errors: ${errors}`);
  
  // Save to JSON
  const fs = require('fs');
  fs.writeFileSync('deals-puppeteer.json', JSON.stringify(deals, null, 2));
  console.log('\nSaved to deals-puppeteer.json');
}

main().catch(console.error);
