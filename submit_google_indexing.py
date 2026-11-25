#!/usr/bin/env python3
"""Submit URLs directly to Google Indexing API for rapid Google Search indexing.
Works with Google Cloud Service Account JSON credentials.

Usage:
  python3 submit_google_indexing.py                     # Submits all URLs from sitemap.xml
  python3 submit_google_indexing.py <url1> <url2>       # Submits specific URLs
  python3 submit_google_indexing.py --status <url>       # Checks indexing notification status
"""
import os, sys, json, time, re, base64, tempfile, subprocess, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_URL = (os.environ.get('SITE_URL') or 'https://www.dhruvboghani.com').strip().rstrip('/')

def find_credentials():
    # 1. Environment variable: JSON string or path
    env_val = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY') or os.environ.get('GOOGLE_CREDENTIALS')
    if env_val:
        env_val = env_val.strip()
        if env_val.startswith('{') and env_val.endswith('}'):
            try:
                return json.loads(env_val)
            except Exception as e:
                print(f"Error parsing GOOGLE_SERVICE_ACCOUNT_KEY JSON: {e}")
        elif os.path.isfile(env_val):
            return json.load(open(env_val, encoding='utf-8'))

    # 2. Look for credential file in directory
    candidates = [
        'service_account.json',
        'service-account.json',
        'google_service_account.json',
        'google-key.json',
        'credentials.json',
        'dark-foundry-515807-g0-f7f5769f99b3.json'
    ]
    # Also check any dark-foundry*.json or *.json with service_account in root
    for fname in os.listdir(ROOT):
        if fname.endswith('.json') and (fname.startswith('dark-foundry') or 'service-account' in fname or 'service_account' in fname):
            if fname not in candidates:
                candidates.append(fname)

    for c in candidates:
        p = os.path.join(ROOT, c)
        if os.path.isfile(p):
            try:
                data = json.load(open(p, encoding='utf-8'))
                if data.get('type') == 'service_account':
                    return data
            except Exception:
                pass
    return None

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def get_access_token(service_account_info: dict) -> str:
    """Acquires Google OAuth2 token using google-auth library if present, or openssl CLI fallback."""
    # Try using google-auth library first
    try:
        from google.oauth2 import service_account as g_sa
        import google.auth.transport.requests as g_req
        creds = g_sa.Credentials.from_service_account_info(
            service_account_info,
            scopes=['https://www.googleapis.com/auth/indexing']
        )
        req = g_req.Request()
        creds.refresh(req)
        return creds.token
    except Exception:
        pass

    # Zero-dependency fallback: standard library + openssl
    client_email = service_account_info.get('client_email')
    private_key = service_account_info.get('private_key')
    token_uri = service_account_info.get('token_uri') or 'https://oauth2.googleapis.com/token'

    if not client_email or not private_key:
        raise ValueError("Invalid service account JSON: missing client_email or private_key")

    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    payload = {
        "iss": client_email,
        "scope": "https://www.googleapis.com/auth/indexing",
        "aud": token_uri,
        "exp": now + 3600,
        "iat": now
    }

    signing_input = (
        base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8')) + "." +
        base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    )

    with tempfile.NamedTemporaryFile('w', delete=False) as kf:
        kf.write(private_key)
        key_path = kf.name

    try:
        proc = subprocess.Popen(
            ['openssl', 'dgst', '-sha256', '-sign', key_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        sig, err = proc.communicate(input=signing_input.encode('utf-8'))
        if proc.returncode != 0:
            raise RuntimeError(f"OpenSSL signing failed: {err.decode('utf-8')}")
    finally:
        if os.path.exists(key_path):
            os.remove(key_path)

    jwt_token = signing_input + "." + base64url_encode(sig)

    token_req_data = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt_token
    }).encode('utf-8')

    req = urllib.request.Request(
        token_uri,
        data=token_req_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.load(resp)
        return res['access_token']

def get_urls_from_sitemap():
    sitemap_path = os.path.join(ROOT, 'sitemap.xml')
    if not os.path.exists(sitemap_path):
        return [SITE_URL + '/']
    content = open(sitemap_path, encoding='utf-8').read()
    urls = re.findall(r'<loc>(.*?)</loc>', content)
    return urls or [SITE_URL + '/']

def submit_url(url: str, token: str, action: str = 'URL_UPDATED'):
    endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
    body = json.dumps({"url": url, "type": action}).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    req = urllib.request.Request(endpoint, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
            notify_time = data.get('urlNotificationMetadata', {}).get('latestUpdate', {}).get('notifyTime', 'now')
            print(f"  [OK 200] {url} (Notified: {notify_time})")
            return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', 'replace')
        print(f"  [ERR {e.code}] {url}")
        if e.code == 403:
            print("    -> Permission Denied: Ensure the Service Account email is added as an 'Owner' in Google Search Console.")
        else:
            print(f"    -> {err_msg[:200]}")
        return False
    except Exception as e:
        print(f"  [ERR] {url}: {e}")
        return False

def check_status(url: str, token: str):
    endpoint = f"https://indexing.googleapis.com/v3/urlNotifications/metadata?url={urllib.parse.quote(url, safe='')}"
    headers = {'Authorization': f'Bearer {token}'}
    req = urllib.request.Request(endpoint, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
            print(json.dumps(data, indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')}")

def main():
    creds = find_credentials()
    if not creds:
        print("=" * 70)
        print("GOOGLE INDEXING API - SERVICE ACCOUNT SETUP REQUIRED")
        print("=" * 70)
        print("To submit pages directly to Google's Indexing API:")
        print("1. Go to Google Cloud Console (https://console.cloud.google.com/).")
        print("2. Enable the 'Web Search Indexing API'.")
        print("3. Create a Service Account (IAM & Admin > Service Accounts).")
        print("4. Download the Service Account JSON key as 'service_account.json' into this folder")
        print("   (or set GOOGLE_SERVICE_ACCOUNT_KEY env var in GitHub Secrets).")
        print("5. Open Google Search Console (https://search.google.com/search-console).")
        print("6. Go to Settings > Users and Permissions > Add User.")
        print("   Paste the Service Account email (e.g. xyz@project.iam.gserviceaccount.com)")
        print("   and set Permission to 'Owner'.")
        print("=" * 70)
        sys.exit(0)

    try:
        print(f"Authenticating with Google OAuth 2.0 ({creds.get('client_email')})...")
        token = get_access_token(creds)
        print("Authentication successful.")
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)

    if '--status' in sys.argv:
        idx = sys.argv.index('--status')
        target = sys.argv[idx + 1] if len(sys.argv) > idx + 1 else (SITE_URL + '/')
        print(f"Querying Google indexing status for: {target}")
        check_status(target, token)
        return

    targets = [arg for arg in sys.argv[1:] if arg.startswith('http')]
    if not targets:
        print(f"Reading URLs from sitemap.xml...")
        targets = get_urls_from_sitemap()

    print(f"Submitting {len(targets)} URL(s) to Google Indexing API...")
    success_count = 0
    # Google Indexing API quota is typically 200 requests/day per project
    batch = targets[:200]
    for u in batch:
        if submit_url(u, token):
            success_count += 1
        time.sleep(0.1)  # avoid rate limiting

    print(f"Completed: {success_count}/{len(batch)} URLs submitted successfully to Google.")

if __name__ == '__main__':
    main()
