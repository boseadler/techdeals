const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const SITES = [
  'https://boseadler.github.io/techdeals/',
  // Localhost disabled - using Tailscale instead
];

async function test() {
  console.log('🧪 Running site tests...\n');
  
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox'] 
  });

  const results = [];
  
  for (const url of SITES) {
    console.log(`Testing: ${url}`);
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      
      // Check page loads
      const title = await page.title();
      console.log(`  ✓ Page loaded: ${title}`);
      
      // Check deals load
      await page.waitForSelector('.deal-card, .card, [class*="card"]', { timeout: 10000 });
      const cards = await page.$$('.deal-card, .card, [class*="card"]');
      console.log(`  ✓ Found ${cards.length} deal cards`);
      
      // Check for errors in console
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      
      await new Promise(r => setTimeout(r, 2000));
      
      results.push({ url, status: 'PASS', cards: cards.length, errors });
      await page.close();
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      results.push({ url, status: 'FAIL', error: err.message });
    }
  }

  await browser.close();

  console.log('\n📊 Results:');
  results.forEach(r => {
    console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.url}: ${r.status} (${r.cards || 0} cards)`);
  });

  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length > 0) {
    console.log('\n⚠️ Site issues detected!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

test();
