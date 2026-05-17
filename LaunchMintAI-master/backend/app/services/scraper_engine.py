import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

HEADERS = {"User-Agent": "Mozilla/5.0 (CompetitorDeepDive)"}

class ScraperEngine:
    async def scrape(self, url: str):
        """Async switch: Tries fast HTTP first, falls back to Async Browser."""
        
        # 1. Try Fast HTTP (Non-blocking)
        try:
            print(f"⚡ [Scraper] Trying fast HTTP scrape: {url}")
            async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
                resp = await client.get(url, headers=HEADERS)
                resp.raise_for_status()
                html = resp.text
                method = "http"
        except Exception as e:
            print(f"⚠️ [Scraper] HTTP failed ({str(e)[:50]}...). Switching to Headless Browser...")
            try:
                html = await self._fetch_browser(url)
                method = "browser"
            except Exception as browser_e:
                # If both fail, return empty so we don't crash the extension
                print(f"❌ [Scraper] Browser also failed: {browser_e}")
                raise browser_e

        text = self._clean_text(html)
        return {
            "url": url,
            "html": html[:5000],
            "text": text,
            "method": method
        }

    async def _fetch_browser(self, url: str):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            # Create a context to avoid bot detection
            context = await browser.new_context(user_agent=HEADERS["User-Agent"])
            page = await context.new_page()
            
            try:
                await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                content = await page.content()
            finally:
                await browser.close()
            
            return content

    def _clean_text(self, html: str) -> str:
        if not html: return ""
        soup = BeautifulSoup(html, "html.parser")
        for script in soup(["script", "style", "noscript", "svg"]):
            script.decompose()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        return text

# Global Instance
scraper = ScraperEngine()