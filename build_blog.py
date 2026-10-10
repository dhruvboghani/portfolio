#!/usr/bin/env python3
"""Daily workflow: add a .md file to content/posts/, then run:  python3 build_blog.py
Builds blog pages, blog index, FAQ, home 'latest posts', SEO tags, sitemap.xml, rss.xml, robots.txt."""
import re, os, json, html, datetime, glob
from zoneinfo import ZoneInfo
ROOT = os.path.dirname(os.path.abspath(__file__))
# Set your real domain here, or as the SITE_URL variable in GitHub. A trailing slash is stripped,
# otherwise every canonical/sitemap URL would get a double slash (https://site.com//page.html).
SITE_URL = (os.environ.get('SITE_URL') or 'https://dhruv-boghani.vercel.app').strip().rstrip('/')
AUTHOR = 'Dhruv Boghani'
SITE_NAME = 'Dhruv Boghani'
OG_IMAGE = SITE_URL + '/assets/og-image.png'   # 1200x630 share preview
# Profiles that are you. Add LinkedIn, Upwork, X etc. here - Google uses these to tie your name to one person.
SAME_AS = ['https://github.com/dhruvboghani']
TODAY = datetime.datetime.now(ZoneInfo('Asia/Kolkata')).date().isoformat()
rd = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, t):
    p = os.path.join(ROOT, p); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(t)
E = lambda s: html.escape(s, quote=True)
SEO = re.compile(r'<!--seo-->.*?<!--/seo-->\n?', re.S)

def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)

def md(t):
    o, p, st = [], [], {'ul': False, 'code': None}
    def fp():
        if p: o.append('<p>' + inline(' '.join(p)) + '</p>'); p.clear()
    def fl():
        if st['ul']: o.append('</ul>'); st['ul'] = False
    for ln in t.split('\n'):
        if ln.startswith('```'):
            if st['code'] is None: fp(); fl(); st['code'] = []
            else: o.append('<pre><code>' + html.escape('\n'.join(st['code']), quote=False) + '</code></pre>'); st['code'] = None
            continue
        if st['code'] is not None: st['code'].append(ln); continue
        m = re.match(r'(#{2,3}) (.+)', ln)
        if m: fp(); fl(); n = len(m.group(1)); o.append('<h%d>%s</h%d>' % (n, inline(m.group(2)), n)); continue
        if ln.startswith('- '):
            fp()
            if not st['ul']: o.append('<ul>'); st['ul'] = True
            o.append('<li>' + inline(ln[2:]) + '</li>'); continue
        if not ln.strip(): fp(); fl(); continue
        fl(); p.append(ln.strip())
    fp(); fl(); return '\n'.join(o)

def load_posts():
    out = []
    for path in glob.glob(os.path.join(ROOT, 'content/posts/*.md')):
        t = open(path, encoding='utf-8').read()
        m = re.match(r'---\n(.*?)\n---\n(.*)', t, re.S)
        if not m: continue
        fm = {}
        for l in m.group(1).split('\n'):
            if ':' in l: k, v = l.split(':', 1); fm[k.strip()] = v.strip()
        if fm.get('draft', '').lower() == 'true' or fm['date'] > TODAY: continue   # drafts and future dates stay hidden
        slug = re.sub(r'^\d{4}-\d\d-\d\d-', '', os.path.splitext(os.path.basename(path))[0])
        out.append(dict(title=fm['title'], desc=fm['description'], date=fm['date'], slug=slug,
                        updated=fm.get('updated') or fm['date'],
                        tags=[x.strip() for x in fm.get('tags', '').split(',') if x.strip()],
                        html=md(m.group(2)), mins=max(1, round(len(m.group(2).split()) / 200))))
    return sorted(out, key=lambda x: x['date'], reverse=True)

TPL = SEO.sub('', rd('index.html'))
def shell(title, desc, body, cur, depth=0):
    h = TPL
    if depth: h = re.sub(r'(href|src)="(?!https?:|mailto:|tel:|#|data:|/)', lambda m: m.group(1) + '="../', h)
    h = re.sub(r'<title>.*?</title>', lambda m: '<title>%s</title>' % E(title), h, 1)
    h = re.sub(r'(<meta name="description" content=").*?(">)', lambda m: m.group(1) + E(desc) + m.group(2), h, 1)
    h = re.sub(r'(<main>\n).*?(\n<footer)', lambda m: m.group(1) + body + m.group(2), h, 1, flags=re.S)
    h = re.sub(r'(<script src="[^"]*common\.js[^"]*"></script>).*?(</body>)', lambda m: m.group(1) + m.group(2), h, 1, flags=re.S)
    h = h.replace(' class="on" aria-current="page"', '')
    return h.replace('<a href="%s%s">' % ('../' if depth else '', cur), '<a href="%s%s" class="on" aria-current="page">' % ('../' if depth else '', cur), 1)

def seo_block(url, title, desc, typ, ld):
    og = lambda a, b: '<meta property="%s" content="%s">' % (a, E(b))
    tw = lambda a, b: '<meta name="%s" content="%s">' % (a, E(b))
    tags = [
        '<link rel="canonical" href="%s">' % E(url),
        og('og:site_name', SITE_NAME), og('og:locale', 'en_IN'), og('og:type', typ),
        og('og:title', title), og('og:description', desc), og('og:url', url),
        og('og:image', OG_IMAGE), og('og:image:width', '1200'), og('og:image:height', '630'),
        og('og:image:alt', 'Dhruv Boghani, AI/ML, data and full-stack engineer'),
        tw('twitter:card', 'summary_large_image'), tw('twitter:title', title),
        tw('twitter:description', desc), tw('twitter:image', OG_IMAGE),
        '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False).replace('</', '<\\/'),
    ]
    return '<!--seo-->\n' + '\n'.join(tags) + '\n<!--/seo-->\n'
crumbs = lambda *items: {'@type': 'BreadcrumbList', 'itemListElement': [
    {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}
AUTHOR_REF = {'@type': 'Person', '@id': SITE_URL + '/#person', 'name': AUTHOR, 'url': SITE_URL + '/'}
add_seo = lambda h, b: SEO.sub('', h).replace('</head>', b + '</head>', 1)
head = lambda a, b, s: '<div class="ttl"><h1>%s <span>%s</span></h1></div><p class="sub">%s</p>' % (a, b, s)
tagsh = lambda l: '<p class="m tg">' + ''.join('<span>%s</span>' % E(x) for x in l) + '</p>'
nxl = lambda href, label: '<a class="nx pn" href="%s"><span class="m u">More</span><b>%s &rarr;</b></a>' % (href, label)

posts = load_posts()
LD = {}
# ---- posts
for p in posts:
    url = '%s/blog/%s.html' % (SITE_URL, p['slug'])
    body = ('<section class="rv"><p class="m u"><a href="../blog.html">&larr; All posts</a></p><h1 class="ph1">%s</h1>'
            '<p class="m u meta">%s / %d min read / %s</p><article class="post">%s</article>'
            '<p class="m u meta" style="margin-top:30px">Need help with AI, LLM or data engineering? <a href="../contact.html"><b>Get in touch</b></a></p></section>%s') % (
            E(p['title']), p['date'], p['mins'], E(', '.join(p['tags'])), p['html'], nxl('../blog.html', 'All posts'))
    h = shell(p['title'] + ' | ' + AUTHOR, p['desc'], body, 'blog.html', 1)
    ld = {'@context': 'https://schema.org', '@graph': [
          {'@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'], 'image': OG_IMAGE,
           'datePublished': p['date'], 'dateModified': p['updated'], 'author': AUTHOR_REF, 'publisher': AUTHOR_REF,
           'mainEntityOfPage': url, 'inLanguage': 'en', 'keywords': ', '.join(p['tags'])},
          crumbs(('Home', SITE_URL + '/'), ('Blog', SITE_URL + '/blog.html'), (p['title'], url))]}
    wr('blog/%s.html' % p['slug'], add_seo(h, seo_block(url, p['title'], p['desc'], 'article', ld)))
# ---- blog index
rows = ''.join('<a class="pr" href="blog/%s.html"><span class="m u">%s / %d min read</span><h3>%s</h3><p>%s</p>%s</a>' % (
    p['slug'], p['date'], p['mins'], E(p['title']), E(p['desc']), tagsh(p['tags'])) for p in posts) or '<p class="pb">First post coming soon.</p>'
wr('blog.html', shell('Blog: AI, LLM and Data Engineering | ' + AUTHOR, 'Practical posts on AI, LLMs, RAG, voice agents and data engineering.',
    '<section class="rv">' + head('Engineering', 'blog', 'Practical notes on AI, LLMs and data engineering. <a href="rss.xml"><b>RSS</b></a>') + '<div class="pn">' + rows + '</div><div style="height:50px"></div></section>', 'blog.html'))
# ---- FAQ
faq = json.load(open(os.path.join(ROOT, 'content/faq.json'), encoding='utf-8'))
items = ''.join('<details class="fq"><summary>%s</summary><p>%s</p></details>' % (E(q), E(a)) for q, a in faq)
LD['faq.html'] = {'@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]}
wr('faq.html', shell('FAQ | ' + AUTHOR, 'Answers about AI, LLM, voice agent, 3D avatar and data engineering projects.',
    '<section class="rv">' + head('Frequently asked', 'questions', 'Quick answers about how I work and what I build.') + '<div class="pn pb">' + items + '</div><div style="height:50px"></div></section>' + nxl('contact.html', 'Contact'), 'faq.html'))
# ---- home: latest posts
if posts:
    n = min(3, len(posts))
    cards = ''.join('<a href="blog/%s.html"><span class="m u" style="color:var(--mute)">%s</span><h4>%s</h4><p>%s</p><span class="m u go">Read &rarr;</span></a>' % (
        p['slug'], p['date'], E(p['title']), E(p['desc'])) for p in posts[:n])
    sec = '<section id="latest" class="rv"><div class="ttl"><h2>Latest <span>posts</span></h2></div><div class="pn"><div class="also" style="--c:%d">%s</div></div></section>' % (n, cards)
    h = rd('index.html'); h = re.sub(r'<section id="latest".*?</section>', lambda m: sec, h, 1, flags=re.S); wr('index.html', h)
# ---- SEO on every root page
PERSON = dict(AUTHOR_REF, **{
          'jobTitle': 'Senior Full Stack, AI & Data Platform Engineer', 'image': OG_IMAGE,
          'email': 'mailto:ramboghani726@gmail.com', 'telephone': '+91-84909-81272',
          'worksFor': {'@type': 'Organization', 'name': 'Novuscode Softtech Pvt. Ltd.'},
          'address': {'@type': 'PostalAddress', 'addressLocality': 'Ahmedabad', 'addressRegion': 'Gujarat', 'addressCountry': 'IN'},
          'sameAs': SAME_AS,
          'knowsAbout': ['Generative AI', 'Large language models', 'RAG', 'Voice AI agents', 'Multi-agent AI', 'Vector databases',
                         'Data engineering', 'Apache Kafka', 'Redpanda', 'Apache Flink', 'Apache Iceberg', 'Trino',
                         'Django', 'FastAPI', 'Node.js', 'Angular', 'React', 'Full-stack development']})
WEBSITE = {'@type': 'WebSite', '@id': SITE_URL + '/#website', 'url': SITE_URL + '/', 'name': SITE_NAME,
           'inLanguage': 'en', 'publisher': {'@id': SITE_URL + '/#person'}}
urls = []
for f in sorted(os.listdir(ROOT)):
    if not f.endswith('.html'): continue
    h = rd(f); url = SITE_URL + ('/' if f == 'index.html' else '/' + f)
    t = re.search(r'<title>(.*?)</title>', h, re.S).group(1); d = re.search(r'<meta name="description" content="(.*?)">', h).group(1)
    if f == 'index.html':
        graph = [PERSON, WEBSITE, {'@type': 'ProfilePage', 'url': url, 'name': html.unescape(t), 'mainEntity': {'@id': SITE_URL + '/#person'}}]
    else:
        name = html.unescape(re.sub(r'\s*\|.*$', '', t))
        page = LD.get(f) or {'@type': 'WebPage', 'name': html.unescape(t), 'description': html.unescape(d), 'url': url,
                             'isPartOf': {'@id': SITE_URL + '/#website'}, 'about': {'@id': SITE_URL + '/#person'}}
        graph = [page, crumbs(('Home', SITE_URL + '/'), (name, url))]
    ld = {'@context': 'https://schema.org', '@graph': graph}
    wr(f, add_seo(h, seo_block(url, html.unescape(t), html.unescape(d), 'website', ld)))
    urls.append((url, None))   # no lastmod: file mtimes after a git checkout are not real edit dates
urls += [('%s/blog/%s.html' % (SITE_URL, p['slug']), p['updated']) for p in posts]
wr('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
   ''.join('<url><loc>%s</loc>%s</url>\n' % (u, '<lastmod>%s</lastmod>' % m if m else '') for u, m in urls) + '</urlset>\n')
wr('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % SITE_URL)
wr('rss.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>%s Blog</title><link>%s/blog.html</link><description>AI, LLM and data engineering</description>\n' % (AUTHOR, SITE_URL) +
   ''.join('<item><title>%s</title><link>%s/blog/%s.html</link><guid>%s/blog/%s.html</guid><pubDate>%s</pubDate><description>%s</description></item>\n' % (
       E(p['title']), SITE_URL, p['slug'], SITE_URL, p['slug'], datetime.datetime.strptime(p['date'], '%Y-%m-%d').strftime('%a, %d %b %Y 00:00:00 +0000'), E(p['desc'])) for p in posts) + '</channel></rss>\n')
print('Built %d posts, %d URLs in sitemap. SITE_URL = %s' % (len(posts), len(urls), SITE_URL))
