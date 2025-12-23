import requests
import os

SERP_API_KEY = os.getenv("f9416792a6cfc970aead29a4b02aa67a262e0f1562fa733d198d30d1a2832d98")
ENDPOINT = "https://serpapi.com/search"

ALLOWED_DOMAINS = [
    "nextjs.org",
    "vercel.com",
    "github.com/vercel/next.js"
]

def search(query):
    params = {
        "q": query,
        "engine": "google",
        "api_key": SERP_API_KEY,
        "num": 5
    }

    response = requests.get(ENDPOINT, params=params)
    response.raise_for_status()

    results = []
    for item in response.json().get("organic_results", []):
        link = item.get("link", "")
        domain = link.split("/")[2] if "://" in link else ""

        if any(d in domain for d in ALLOWED_DOMAINS):
            results.append({
                "title": item.get("title"),
                "url": link,
                "snippet": item.get("snippet", "")
            })

    return results

