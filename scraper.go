package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/chromedp/chromedp"
)

type Deal struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Price       string `json:"price"`
	Original    string `json:"originalPrice"`
	Discount    string `json:"discount"`
	Store       string `json:"store"`
	Category    string `json:"category"`
	Condition   string `json:"condition"`
	ImageURL    string `json:"imageUrl"`
	ProductURL  string `json:"url"`
	IsGoodDeal  bool   `json:"isGoodDeal"`
}

var products = []struct {
	URL      string
	Category string
	Store    string
}{
	// CPUs
	{"https://altex.ro/procesor-amd-ryzen-5-5600-3-5ghz-4-4ghz-socket-am4-100-100000927box/", "cpu", "Altex"},
	{"https://altex.ro/procesor-amd-ryzen-5-5600x-3-7ghz-4-6ghz-socket-am4-100-100000065box/", "cpu", "Altex"},
	{"https://www.vexio.ro/procesoare/amd/2726599-ryzen-5-5600-3-50ghz-socket-am4-tray-fara-cooler/", "cpu", "Vexio"},
	// Laptops
	{"https://altex.ro/laptop-hp-probook-450-g9-intel-core-i5-1235u-pana-la-4-4ghz-15-6-full-hd-8gb-ssd-512gb-intel-uhd-graphics-windows-11-pro-argintiu/", "laptop", "Altex"},
	{"https://altex.ro/laptop-asus-vivobook-go-15-l1504fa-bq611-amd-ryzen-5-7520u-pana-la-4-3ghz-15-6-full-hd-8gb-ssd-512gb-amd-radeon-610m-free-dos-mixed-black/", "laptop", "Altex"},
}

func main() {
	// Create context with longer timeout
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	// Create headless browser with options
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Headless,
		chromedp.DisableGPU,
		chromedp.NoSandbox,
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(ctx, opts...)
	defer cancelAlloc()

	taskCtx, cancelTask := chromedp.NewContext(allocCtx)
	defer cancelTask()

	var deals []Deal

	for i, p := range products {
		fmt.Printf("Scraping %d/%d: %s\n", i+1, len(products), p.Store)

		var result map[string]string

		// Navigate and wait for page to load
		err := chromedp.Run(taskCtx,
			chromedp.Navigate(p.URL),
			chromedp.Sleep(5*time.Second), // Wait for JS to render
			chromedp.Evaluate(`
				(() => {
					let data = { title: '', price: '', originalPrice: '', imageURL: '' };
					
					// Try to find product title
					const titleEl = document.querySelector('h1') || document.querySelector('[data-product-name]') || document.querySelector('.product-title') || document.querySelector('h2');
					if (titleEl) data.title = titleEl.innerText.trim();
					
					// Try to find price
					const priceEl = document.querySelector('[data-price]') || document.querySelector('.price') || document.querySelector('.product-price') || document.querySelector('[class*="CurrentPrice"]');
					if (priceEl) data.price = priceEl.innerText.trim();
					
					// Try to find original price
					const origEl = document.querySelector('[data-old-price]') || document.querySelector('.old-price') || document.querySelector('.original-price');
					if (origEl) data.originalPrice = origEl.innerText.trim();
					
					// Try to find product image
					const imgEl = document.querySelector('.product-image img') || document.querySelector('[data-main-image]') || document.querySelector('.gallery img') || document.querySelector('img[class*="product"]') || document.querySelector('.gallery-image img');
					if (imgEl && imgEl.src) data.imageURL = imgEl.src;
					if (!data.imageURL) {
						const ogImage = document.querySelector('meta[property="og:image"]');
						if (ogImage) data.imageURL = ogImage.content;
					}
					
					return data;
				})()
			`, &result),
		)
		
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			continue
		}

		// Debug: print what we got
		fmt.Printf("  Title: %s\n", result["title"])
		fmt.Printf("  Price: %s\n", result["price"])
		fmt.Printf("  Image: %s\n", result["imageURL"])

		deal := Deal{
			ID:         fmt.Sprintf("%d", i+1),
			Title:      result["title"],
			Price:      result["price"],
			Original:   result["originalPrice"],
			Store:      p.Store,
			Category:   p.Category,
			ProductURL: p.URL,
			ImageURL:   result["imageURL"],
		}

		deals = append(deals, deal)
	}

	// Save to JSON
	data, err := json.MarshalIndent(deals, "", "  ")
	if err != nil {
		log.Fatal(err)
	}

	err = os.WriteFile("deals.json", data, 0644)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\nSaved %d deals to deals.json\n", len(deals))
}
