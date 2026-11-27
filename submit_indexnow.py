#!/usr/bin/env python3
"""Submit updated URLs to IndexNow (Bing, Yandex, Seznam, Naver).
Can be run locally or via CI/CD (GitHub Actions).

Usage:
  python3 submit_indexnow.py                 # Submits all URLs from sitemap.xml
  python3 submit_indexnow.py <url1> <url2>   # Submits specific URLs
"""
import os, sys, json, re, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_URL = (os.environ.get('SITE_URL') or 'https://www.dhruvboghani.com').strip().rstrip('/')
HOST = re.sub(r'^https?://', '', SITE_URL).split('/')[0]

# IndexNow Key: Can be passed via env var or read from the key file
KEY = os.environ.get('INDEXNOW_KEY') or 'fb5281cb6a82f7d54d3d10a6b0a20355'
KEY_LOCATION = f"{SITE_URL}/{KEY}.txt"

def get_urls_from_sitemap():
    sitemap_path = os.path.join(ROOT, 'sitemap.xml')
    if not os.path.exists(sitemap_path):
        return [SITE_URL + '/']
    content = open(sitemap_path, encoding='utf-8').read()
    urls = re.findall(r'<loc>(.*?)</loc>', content)
    return urls or [SITE_URL + '/']

def submit(urls):
    if not urls:
        print("No URLs to submit to IndexNow.")
        return

    # IndexNow accepts up to 10,000 URLs per request
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls[:10000]
    }
    
    endpoints = [
        "https://api.indexnow.org/indexnow",
        "https://yandex.com/indexnow",
    ]
    data = json.dumps(payload, indent=2).encode('utf-8')
    headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'IndexNow-Submitter/1.0'
    }

    for endpoint in endpoints:
        print(f"Submitting {len(payload['urlList'])} URL(s) to IndexNow ({endpoint})...")
        print(f"Host: {HOST} | Key Location: {KEY_LOCATION}")

        req = urllib.request.Request(endpoint, data=data, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                reason = resp.reason
                print(f"IndexNow Response: HTTP {status} {reason}")
                if status in (200, 202):
                    print("Successfully submitted URLs to IndexNow! Search engines (Bing, Yandex, etc.) will prioritize indexing.")
                    return
                else:
                    print(f"IndexNow returned HTTP {status}.")
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'replace')
            print(f"IndexNow Error HTTP {e.code} {e.reason}: {body}")
            if endpoint != endpoints[-1]:
                print("Trying fallback IndexNow endpoint...")
                continue
            if e.code in (403, 422):
                print("Note: HTTP 403/422 occurs when the key file is not yet deployed or reachable on the live website.")
                print(f"Once you run 'git push' and Vercel deploys '{KEY}.txt' to {KEY_LOCATION}, IndexNow will verify the key.")
        except Exception as e:
            print(f"Failed to submit to IndexNow ({endpoint}): {e}")
            if endpoint != endpoints[-1]:
                print("Trying fallback IndexNow endpoint...")
                continue

if __name__ == '__main__':
    if len(sys.argv) > 1:
        target_urls = [u for u in sys.argv[1:] if u.startswith('http')]
    else:
        target_urls = get_urls_from_sitemap()
    submit(target_urls)
