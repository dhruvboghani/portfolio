#!/usr/bin/env python3
"""Daily workflow: add a .md file to content/posts/, then run:  python3 build_blog.py
Builds blog pages, blog index, FAQ, home 'latest posts', SEO tags, sitemap.xml, rss.xml, robots.txt."""
import re, os, json, html, datetime, glob
from zoneinfo import ZoneInfo
ROOT = os.path.dirname(os.path.abspath(__file__))
# Set your real domain here, or as the SITE_URL variable in GitHub. A trailing slash is stripped,
# otherwise every canonical/sitemap URL would get a double slash (https://site.com//page.html).
SITE_URL = (os.environ.get('SITE_URL') or 'https://www.dhruvboghani.com').strip().rstrip('/')
AUTHOR = 'Dhruv Boghani'
SITE_NAME = 'Dhruv Boghani'
OG_IMAGE = SITE_URL + '/assets/og-image.png'   # 1200x630 share preview
# Profiles that are you. Add LinkedIn, Upwork, X etc. here - Google uses these to tie your name to one person.
SAME_AS = ['https://github.com/dhruvboghani', 'https://www.linkedin.com/in/dhruv-boghani-21b8781b1']
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
    h = re.sub(r'<title>.*?</title>', lambda m: '<title>%s</title>' % E(title), h, count=1)
    h = re.sub(r'(<meta name="description" content=").*?(">)', lambda m: m.group(1) + E(desc) + m.group(2), h, count=1)
    h = re.sub(r'(<main>\n).*?(\n<footer)', lambda m: m.group(1) + body + m.group(2), h, count=1, flags=re.S)
    h = re.sub(r'(<script src="[^"]*common\.js[^"]*"></script>).*?(</body>)', lambda m: m.group(1) + m.group(2), h, count=1, flags=re.S)
    h = h.replace(' class="on" aria-current="page"', '')
    return h.replace('<a href="%s%s">' % ('../' if depth else '', cur), '<a href="%s%s" class="on" aria-current="page">' % ('../' if depth else '', cur), 1)

def seo_block(url, title, desc, typ, ld):
    og = lambda a, b: '<meta property="%s" content="%s">' % (a, E(b))
    tw = lambda a, b: '<meta name="%s" content="%s">' % (a, E(b))
    tags = [
        '<link rel="canonical" href="%s">' % E(url),
        '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
        '<meta name="author" content="%s">' % E(AUTHOR),
        '<link rel="icon" href="/favicon.ico" sizes="48x48">',
        '<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">',
        '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">',
        '<meta name="theme-color" content="#ECEBE6">',
        og('og:site_name', SITE_NAME), og('og:locale', 'en_IN'), og('og:type', typ),
        og('og:title', title), og('og:description', desc), og('og:url', url),
        og('og:image', OG_IMAGE), og('og:image:width', '1200'), og('og:image:height', '630'),
        og('og:image:alt', 'Dhruv Boghani, AI/ML, data and full-stack engineer'),
        tw('twitter:card', 'summary_large_image'), tw('twitter:title', title),
        tw('twitter:description', desc), tw('twitter:image', OG_IMAGE),
        '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False).replace('</', '<\\/'),
    ]
    return '<!--seo-->\n' + '\n'.join(tags) + '\n<!--/seo-->\n'
def serp_title(t):
    # Google cuts titles at about 60 characters. Add the name only when it still fits
    # (Google shows the site name separately anyway). Character-based so every machine builds the same output.
    full = t + ' | ' + AUTHOR
    return full if len(full) <= 62 else t
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
    body = ('<section class="rv in"><p class="m u"><a href="../blog.html">&larr; All posts</a></p><h1 class="ph1">%s</h1>'
            '<p class="m u meta">%s / %d min read / %s</p><article class="post">%s</article>'
            '<p class="m u meta" style="margin-top:30px">Need help with AI, LLM or data engineering? <a href="../contact.html"><b>Get in touch</b></a></p></section>%s') % (
            E(p['title']), p['date'], p['mins'], E(', '.join(p['tags'])), p['html'], nxl('../blog.html', 'All posts'))
    h = shell(serp_title(p['title']), p['desc'], body, 'blog.html', 1)
    ld = {'@context': 'https://schema.org', '@graph': [
          {'@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'], 'image': OG_IMAGE,
           'datePublished': p['date'], 'dateModified': p['updated'], 'author': AUTHOR_REF, 'publisher': AUTHOR_REF,
           'mainEntityOfPage': url, 'inLanguage': 'en', 'keywords': ', '.join(p['tags']),
           'articleSection': p['tags'][0] if p['tags'] else 'Technology',
           'wordCount': len(p['html'].split()),
           'timeRequired': 'PT%dM' % p['mins'],
           'speakable': {'@type': 'SpeakableSpecification', 'cssSelector': ['.ph1', '.post > p:first-of-type', '.post > h2:first-of-type']}},
          crumbs(('Home', SITE_URL + '/'), ('Blog', SITE_URL + '/blog.html'), (p['title'], url))]}
    wr('blog/%s.html' % p['slug'], add_seo(h, seo_block(url, p['title'], p['desc'], 'article', ld)))
# ---- blog index
rows = ''.join('<a class="pr" href="blog/%s.html"><span class="m u">%s / %d min read</span><h2>%s</h2><p>%s</p>%s</a>' % (
    p['slug'], p['date'], p['mins'], E(p['title']), E(p['desc']), tagsh(p['tags'])) for p in posts) or '<p class="pb">First post coming soon.</p>'
wr('blog.html', shell('AI, LLM & Data Engineering Blog | ' + AUTHOR, 'Practical guides on LLMs, RAG, voice AI agents, vector databases and real-time data pipelines (Kafka, Flink, Iceberg), from production work.',
    '<section class="rv in">' + head('Engineering', 'blog', 'Practical notes on AI, LLMs and data engineering. <a href="rss.xml"><b>RSS</b></a>') + '<div class="pn">' + rows + '</div><div style="height:50px"></div></section>', 'blog.html'))
# ---- FAQ
faq = json.load(open(os.path.join(ROOT, 'content/faq.json'), encoding='utf-8'))
items = ''.join('<details class="fq"><summary>%s</summary><p>%s</p></details>' % (E(q), E(a)) for q, a in faq)
LD['faq.html'] = {'@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]}
wr('faq.html', shell('FAQ: Hiring an AI & Data Engineer | ' + AUTHOR, 'Answers on hiring Dhruv Boghani for AI, LLM, RAG, voice agent, 3D avatar and data engineering projects: stack, process, timelines and remote work.',
    '<section class="rv in">' + head('Frequently asked', 'questions', 'Quick answers about how I work and what I build.') + '<div class="pn pb">' + items + '</div><div style="height:50px"></div></section>' + nxl('contact.html', 'Contact'), 'faq.html'))
# ---- home: latest posts
if posts:
    n = min(3, len(posts))
    cards = ''.join('<a href="blog/%s.html"><span class="m u" style="color:var(--mute)">%s</span><h3>%s</h3><p>%s</p><span class="m u go">Read &rarr;</span></a>' % (
        p['slug'], p['date'], E(p['title']), E(p['desc'])) for p in posts[:n])
    sec = '<section id="latest" class="rv"><div class="ttl"><h2>Latest <span>posts</span></h2></div><div class="pn"><div class="also" style="--c:%d">%s</div></div></section>' % (n, cards)
    h = rd('index.html'); h = re.sub(r'<section id="latest".*?</section>', lambda m: sec, h, count=1, flags=re.S); wr('index.html', h)
# ---- SEO on every root page
PERSON = dict(AUTHOR_REF, **{
    'jobTitle': 'Senior Full Stack, AI & Data Platform Engineer',
    'description': 'Senior Full Stack, AI & Data Platform Engineer with 5+ years experience building production AI/LLM architectures, streaming lakehouses (Kafka, Flink, Iceberg), and voice AI agents.',
    'image': OG_IMAGE,
    'email': 'mailto:ramboghani726@gmail.com',
    'telephone': '+91-84909-81272',
    'worksFor': {'@type': 'Organization', 'name': 'Novuscode Softtech Pvt. Ltd.'},
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Ahmedabad', 'addressRegion': 'Gujarat', 'addressCountry': 'IN'},
    'alumniOf': {'@type': 'EducationalOrganization', 'name': 'Gujarat Technological University', 'sameAs': 'https://en.wikipedia.org/wiki/Gujarat_Technological_University'},
    'sameAs': SAME_AS,
    'knowsAbout': [
        {'@type': 'DefinedTerm', 'name': 'Generative Artificial Intelligence', 'sameAs': 'https://en.wikipedia.org/wiki/Generative_artificial_intelligence'},
        {'@type': 'DefinedTerm', 'name': 'Large Language Model', 'sameAs': 'https://en.wikipedia.org/wiki/Large_language_model'},
        {'@type': 'DefinedTerm', 'name': 'Retrieval-Augmented Generation', 'sameAs': 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation'},
        {'@type': 'DefinedTerm', 'name': 'Apache Iceberg', 'sameAs': 'https://en.wikipedia.org/wiki/Apache_Iceberg'},
        {'@type': 'DefinedTerm', 'name': 'Apache Kafka', 'sameAs': 'https://en.wikipedia.org/wiki/Apache_Kafka'},
        {'@type': 'DefinedTerm', 'name': 'Apache Flink', 'sameAs': 'https://en.wikipedia.org/wiki/Apache_Flink'},
        {'@type': 'DefinedTerm', 'name': 'Trino', 'sameAs': 'https://en.wikipedia.org/wiki/Trino_(SQL_query_engine)'},
        {'@type': 'DefinedTerm', 'name': 'WebRTC', 'sameAs': 'https://en.wikipedia.org/wiki/WebRTC'},
        {'@type': 'DefinedTerm', 'name': 'Data Engineering', 'sameAs': 'https://en.wikipedia.org/wiki/Data_engineering'},
        {'@type': 'DefinedTerm', 'name': 'Vector Database', 'sameAs': 'https://en.wikipedia.org/wiki/Vector_database'},
        'Voice AI agents', 'Multi-agent AI workflows', 'FastAPI', 'Django', 'Node.js', 'Angular', 'React', 'Full-stack development',
        'Generative Engine Optimization (GEO)', 'Answer Engine Optimization (AEO)'
    ],
    'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Engineering Services',
        'itemListElement': [
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': 'Generative AI & LLM Engineering', 'description': 'Production RAG pipelines, fine-tuning, prompt engineering, and intelligent multi-agent workflows.'}},
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': 'Real-Time Voice AI Agents', 'description': 'Sub-500ms WebRTC conversational voice bots, Twilio telephony integration, and 3D talking avatars.'}},
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': 'Streaming Data Lakehouses', 'description': 'High-throughput real-time data platforms with Kafka, Redpanda, Apache Flink, Apache Iceberg, and Trino.'}},
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': 'Enterprise Full-Stack Platforms', 'description': 'Scalable multi-tenant SaaS architectures, microservices, and reactive web applications.'}}
        ]
    }
})

WEBSITE = {
    '@type': 'WebSite',
    '@id': SITE_URL + '/#website',
    'url': SITE_URL + '/',
    'name': SITE_NAME,
    'inLanguage': 'en',
    'publisher': {'@id': SITE_URL + '/#person'}
}

GRAHAVANI_APP = {
    '@type': 'WebApplication',
    '@id': 'https://grahavani.dhruvboghani.com/#app',
    'name': 'Grahavani',
    'url': 'https://grahavani.dhruvboghani.com/',
    'applicationCategory': 'LifestyleApplication',
    'operatingSystem': 'All, Web, Android',
    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'INR'},
    'author': {'@id': SITE_URL + '/#person'},
    'description': 'Free Vedic astrology platform in 6 Indian languages with Janma Kundali, Guna Milan, and Panchang calculated using orbital math checked against the Swiss Ephemeris.'
}

RANKDESK_APP = {
    '@type': 'WebApplication',
    '@id': 'https://rankdesk.dhruvboghani.com/#app',
    'name': 'Rankdesk',
    'url': 'https://rankdesk.dhruvboghani.com/',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'All, Web',
    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
    'author': {'@id': SITE_URL + '/#person'},
    'description': 'Free 24-point SEO audit toolkit with Google PageSpeed, Core Web Vitals, and JSON-LD schema, robots.txt, and sitemap generators.'
}

PULSEWIRE_APP = {
    '@type': 'WebApplication',
    '@id': 'https://pulsewire.dhruvboghani.com/#app',
    'name': 'PulseWire',
    'url': 'https://pulsewire.dhruvboghani.com/',
    'applicationCategory': 'NewsApplication',
    'operatingSystem': 'All, Web',
    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
    'author': {'@id': SITE_URL + '/#person'},
    'description': 'Real-time global newsroom delivering breaking world news, live cricket scores, financial market intelligence (Sensex, Nifty, Crypto), and verified editorial coverage.'
}

# Rich page schemas for specific applications/pages
LD['work.html'] = {
    '@type': 'CollectionPage',
    'name': 'Projects & Tech Stack: AI, Data, SaaS | ' + AUTHOR,
    'description': 'Fourteen platforms built across generative AI, voice agents, EdTech, data engineering, SaaS, astrology, news intelligence and SEO, with case studies and the full tech stack.',
    'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Grahavani: Vedic Astrology', 'url': 'https://grahavani.dhruvboghani.com/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'PulseWire: Live Newsroom', 'url': 'https://pulsewire.dhruvboghani.com/'},
            {'@type': 'ListItem', 'position': 3, 'name': 'Rankdesk: SEO Toolkit', 'url': 'https://rankdesk.dhruvboghani.com/'},
            {'@type': 'ListItem', 'position': 4, 'name': 'Real-Time Data Lakehouse', 'url': SITE_URL + '/pipeline.html'},
            {'@type': 'ListItem', 'position': 5, 'name': 'AI Voice Calling Agent & CRM', 'url': SITE_URL + '/voice-agent.html'},
            {'@type': 'ListItem', 'position': 6, 'name': 'AI Sales Avatar', 'url': SITE_URL + '/voice-avatar.html'},
            {'@type': 'ListItem', 'position': 7, 'name': 'AI Admin Assistant', 'url': SITE_URL + '/admin-assistant.html'},
            {'@type': 'ListItem', 'position': 8, 'name': 'Invoice Compare AI', 'url': SITE_URL + '/invoice-ai.html'}
        ]
    }
}

LD['pipeline.html'] = {
    '@type': 'TechArticle',
    'headline': 'Real-Time Data Lakehouse: Redpanda, Flink, Iceberg & Trino',
    'description': 'Interactive demonstration of an enterprise streaming data lakehouse handling 10M+ events per day with time-travel queries, schema evolution, and dead-letter queue isolation.',
    'author': AUTHOR_REF,
    'publisher': AUTHOR_REF,
    'about': [{'@type': 'Thing', 'name': 'Apache Iceberg'}, {'@type': 'Thing', 'name': 'Apache Flink'}, {'@type': 'Thing', 'name': 'Redpanda'}, {'@type': 'Thing', 'name': 'Trino'}],
    'inLanguage': 'en'
}

LD['voice-agent.html'] = {
    '@type': 'TechArticle',
    'headline': 'Real-Time AI Voice Calling Agent with Twilio and CRM Automation',
    'description': 'Sub-500ms conversational phone agent utilizing Twilio, Pipecat, and Azure OpenAI LLM to handle customer calls, detect sentiment, and automatically update CRM pipelines.',
    'author': AUTHOR_REF,
    'publisher': AUTHOR_REF,
    'about': [{'@type': 'Thing', 'name': 'Voice AI'}, {'@type': 'Thing', 'name': 'Twilio'}, {'@type': 'Thing', 'name': 'Pipecat'}, {'@type': 'Thing', 'name': 'CRM Automation'}],
    'inLanguage': 'en'
}

LD['voice-avatar.html'] = {
    '@type': 'TechArticle',
    'headline': 'Interactive 3D AI Sales Avatar with Voice-to-Voice LLM Intelligence',
    'description': '3D interactive avatar that conducts voice-to-voice dialogues, answers product catalog inquiries, captures qualification leads, and books appointments.',
    'author': AUTHOR_REF,
    'publisher': AUTHOR_REF,
    'about': [{'@type': 'Thing', 'name': '3D Avatar'}, {'@type': 'Thing', 'name': 'Speech AI'}, {'@type': 'Thing', 'name': 'Lead Generation'}],
    'inLanguage': 'en'
}

LD['admin-assistant.html'] = {
    '@type': 'TechArticle',
    'headline': 'Enterprise AI Admin Assistant with Natural Language Tool Calling',
    'description': 'Voice and text enabled 3D admin assistant that leverages LLM function calling to retrieve enterprise ERP records, invoices, purchase orders, inventory, and sales.',
    'author': AUTHOR_REF,
    'publisher': AUTHOR_REF,
    'about': [{'@type': 'Thing', 'name': 'Function Calling'}, {'@type': 'Thing', 'name': 'ERP'}, {'@type': 'Thing', 'name': 'Enterprise AI'}],
    'inLanguage': 'en'
}

LD['invoice-ai.html'] = {
    '@type': 'TechArticle',
    'headline': 'Invoice Compare AI: Multi-Layer Document Parsing & Variance Detection',
    'description': 'Production document intelligence system utilizing LLMs and vector search to parse complex invoices, detect HSN codes, and identify discrepancies against purchase orders.',
    'author': AUTHOR_REF,
    'publisher': AUTHOR_REF,
    'about': [{'@type': 'Thing', 'name': 'Document AI'}, {'@type': 'Thing', 'name': 'RAG'}, {'@type': 'Thing', 'name': 'Financial Automation'}],
    'inLanguage': 'en'
}

LD['experience.html'] = {
    '@type': 'ProfilePage',
    'name': 'Experience: Senior AI & Data Engineer | ' + AUTHOR,
    'description': '5+ years building AI-powered SaaS, real-time data pipelines and enterprise apps at Novuscode Softtech and Techspin Solutions, Ahmedabad.',
    'mainEntity': {'@id': SITE_URL + '/#person'}
}

urls, serp = [], [(SITE_URL + '/blog/%s.html' % p['slug'], serp_title(p['title']), p['desc']) for p in posts]
page_priorities = {
    'index.html': ('1.0', 'daily'),
    'work.html': ('0.9', 'weekly'),
    'pipeline.html': ('0.9', 'weekly'),
    'voice-agent.html': ('0.9', 'weekly'),
    'voice-avatar.html': ('0.9', 'weekly'),
    'admin-assistant.html': ('0.9', 'weekly'),
    'invoice-ai.html': ('0.9', 'weekly'),
    'blog.html': ('0.9', 'daily'),
    'faq.html': ('0.8', 'weekly'),
    'experience.html': ('0.8', 'monthly'),
    'contact.html': ('0.8', 'monthly'),
}

for f in sorted(os.listdir(ROOT)):
    if not f.endswith('.html'): continue
    h = rd(f); url = SITE_URL + ('/' if f == 'index.html' else '/' + f)
    t = re.search(r'<title>(.*?)</title>', h, re.S).group(1); d = re.search(r'<meta name="description" content="(.*?)">', h).group(1)
    if f == 'index.html':
        graph = [PERSON, WEBSITE, GRAHAVANI_APP, PULSEWIRE_APP, RANKDESK_APP, {'@type': 'ProfilePage', 'url': url, 'name': html.unescape(t), 'mainEntity': {'@id': SITE_URL + '/#person'}}]
    else:
        name = html.unescape(re.sub(r'\s*\|.*$', '', t))
        page = LD.get(f) or {'@type': 'WebPage', 'name': html.unescape(t), 'description': html.unescape(d), 'url': url,
                             'isPartOf': {'@id': SITE_URL + '/#website'}, 'about': {'@id': SITE_URL + '/#person'}}
        graph = [page, crumbs(('Home', SITE_URL + '/'), (name, url))]
    ld = {'@context': 'https://schema.org', '@graph': graph}
    wr(f, add_seo(h, seo_block(url, html.unescape(t), html.unescape(d), 'website', ld)))
    serp.append((url, html.unescape(t), html.unescape(d)))
    prio, freq = page_priorities.get(f, ('0.7', 'weekly'))
    urls.append((url, TODAY, prio, freq))

for p in posts:
    urls.append(('%s/blog/%s.html' % (SITE_URL, p['slug']), p['updated'], '0.7', 'monthly'))

# High-quality sitemap.xml with lastmod, changefreq, and priority
sitemap_xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u, mod, prio, freq in urls:
    sitemap_xml.append(f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{mod}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>')
sitemap_xml.append('</urlset>\n')
wr('sitemap.xml', '\n'.join(sitemap_xml))

# Comprehensive robots.txt welcoming all standard crawlers and AI answer engines
robots_txt = """# robots.txt for https://www.dhruvboghani.com
User-agent: *
Allow: /

# Standard Search Engine Crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

User-agent: Applebot
Allow: /

# AI, Generative Engine Optimization (GEO) & Answer Engine Crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: %s/sitemap.xml
Host: %s
""" % (SITE_URL, re.sub(r'^https?://', '', SITE_URL))
wr('robots.txt', robots_txt)

# llms.txt standard
llms_txt = (
    "# Dhruv Boghani - Senior Full Stack, AI & Data Platform Engineer\n\n"
    "> Senior Full Stack, AI & Data Platform Engineer with 5+ years experience building production AI/LLM architectures, streaming lakehouses (Kafka, Flink, Iceberg), and voice AI agents.\n\n"
    "## Identity & Verification\n"
    "- Full Name: Dhruv Boghani\n"
    "- Professional Role: Senior Full Stack, AI & Data Platform Engineer\n"
    "- Location: Ahmedabad, Gujarat, India\n"
    "- Canonical Website: https://www.dhruvboghani.com\n"
    "- GitHub: https://github.com/dhruvboghani\n"
    "- LinkedIn: https://www.linkedin.com/in/dhruv-boghani-21b8781b1\n"
    "- Email: ramboghani726@gmail.com\n"
    "- Phone: +91 84909 81272\n\n"
    "## Core Technical Capabilities\n"
    "- **Generative AI & LLMs:** RAG architectures, prompt compression, semantic caching, function calling, fine-tuning, multi-agent workflows, vector databases (pgvector, Pinecone).\n"
    "- **Voice AI & Real-time Agents:** WebRTC audio streaming, LiveKit, low-latency STT/TTS pipelines, conversational barge-in, 3D interactive avatars.\n"
    "- **Real-Time Data Platforms:** Apache Kafka, Redpanda, Apache Flink stateful processing, Apache Iceberg lakehouses, Trino distributed SQL, Nessie catalog, Change Data Capture (CDC).\n"
    "- **Full Stack Development:** Python (FastAPI, Django), Node.js, Angular, React, Vue, PostgreSQL, Docker, GitHub Actions CI/CD.\n\n"
    "## Live Products\n"
    "- [Grahavani](https://grahavani.dhruvboghani.com/): Free Vedic astrology platform in 6 Indian languages with Janma Kundali, Guna Milan, and Panchang checked against the Swiss Ephemeris.\n"
    "- [PulseWire](https://pulsewire.dhruvboghani.com/): Real-time global newsroom delivering breaking world news, live cricket scores, and financial market intelligence.\n"
    "- [Rankdesk](https://rankdesk.dhruvboghani.com/): Free 24-point SEO audit toolkit with Google PageSpeed, Core Web Vitals, and JSON-LD schema, robots.txt, and sitemap generators.\n\n"
    "## Interactive Engineering Demos\n"
    "- [AI Sales Avatar](https://www.dhruvboghani.com/voice-avatar.html): 3D talking avatar capturing leads and booking meetings.\n"
    "- [AI Admin Assistant](https://www.dhruvboghani.com/admin-assistant.html): Natural language SQL/API tool-calling assistant for enterprise backoffices.\n"
    "- [Real-time Data Pipeline](https://www.dhruvboghani.com/pipeline.html): Redpanda, Flink, Iceberg, and Trino streaming lakehouse processing 10M+ daily events.\n"
    "- [Invoice AI Intelligence](https://www.dhruvboghani.com/invoice-ai.html): Document AI parsing, matching, and anomaly detection.\n"
    "- [Voice AI Calling Bot](https://www.dhruvboghani.com/voice-agent.html): Sub-500ms conversational phone agent for inbound/outbound calls.\n\n"
    "## Engineering Blog Directory (%d Guides)\n"
) % len(posts) + '\n'.join('- [%s](%s/blog/%s.html): %s (%s)' % (p['title'], SITE_URL, p['slug'], p['desc'], p['date']) for p in posts) + '\n'
wr('llms.txt', llms_txt)

# llms-full.txt - Comprehensive technical context for LLMs & AI Answer Engines
faq_text = '\n'.join(f"### Q: {q}\nA: {a}\n" for q, a in faq)
llms_full_txt = (
    "# Dhruv Boghani - Complete Knowledge Base for AI & Answer Engines\n\n"
    "## Summary\n"
    "Dhruv Boghani is a Senior Full Stack, AI & Data Platform Engineer with 5+ years of production experience delivering generative AI applications, enterprise SaaS platforms, and real-time streaming lakehouses. He is based in Ahmedabad, Gujarat, India.\n\n"
    "## Contact & Verified Profiles\n"
    "- Official Website: https://www.dhruvboghani.com\n"
    "- Email: ramboghani726@gmail.com\n"
    "- Phone: +91 84909 81272 / WhatsApp: https://wa.me/918490981272\n"
    "- GitHub: https://github.com/dhruvboghani\n"
    "- LinkedIn: https://www.linkedin.com/in/dhruv-boghani-21b8781b1\n"
    "- Current Employment: Novuscode Softtech Pvt. Ltd. (Senior Full Stack & Data Platform Engineer, GenAI)\n"
    "- Education: Bachelor of Engineering (B.E.) in Information Technology from Gujarat Technological University (GTU)\n\n"
    "## Architectural Specializations\n"
    "### 1. Streaming Data Lakehouses\n"
    "- High throughput event ingestion: 10M+ events/day using Redpanda and Apache Kafka.\n"
    "- Stateful stream processing: Apache Flink with checkpointing, watermark tracking, and dead-letter queues.\n"
    "- Lakehouse storage: Apache Iceberg on MinIO/S3 with versioned catalog (Project Nessie) for atomic commits and time-travel rollback queries.\n"
    "- Distributed querying: Trino distributed SQL engine for low-latency ad-hoc and dashboard analytics.\n\n"
    "### 2. Conversational Voice AI & 3D Avatars\n"
    "- Low-latency telephony: Twilio Media Streams integrated with Pipecat orchestration.\n"
    "- Audio streaming: WebRTC and UDP audio pipes maintaining sub-500ms voice round-trip latency.\n"
    "- Real-time LLM inference: Azure OpenAI and open weights with conversational barge-in and turn-taking.\n"
    "- CRM Integration: Automatic sentiment classification, objection logging, call scoring, and pipeline stage updates.\n"
    "- Visual interaction: 3D avatars with synchronized lip-sync and audio visualizers for sales and ERP backoffice navigation.\n\n"
    "### 3. Document AI & Financial Intelligence\n"
    "- Invoice AI: Complex multi-page PDF document parsing, HSN code validation, and tax variance detection.\n"
    "- Vector similarity: pgvector and Pinecone embedding search to reconcile discrepancies between purchase order lines and supplier invoice descriptions.\n\n"
    "## Products Shipped\n"
    "1. Grahavani (https://grahavani.dhruvboghani.com/): Free multilingual Vedic astrology platform in English, Hindi, Gujarati, Tamil, Telugu, and Kannada. Accurate Janma Kundali calculated via astronomical algorithms verified against the Swiss Ephemeris within one arc-minute precision.\n"
    "2. PulseWire (https://pulsewire.dhruvboghani.com/): Real-time global newsroom delivering breaking world news, live cricket scores, financial markets (Sensex, Nifty, Crypto), and verified editorial intelligence.\n"
    "3. Rankdesk (https://rankdesk.dhruvboghani.com/): Free comprehensive 24-point SEO auditing platform with Google PageSpeed API, Core Web Vitals diagnostics, and instant schema/robots/sitemap generators.\n\n"
    "## Frequently Asked Questions (FAQ)\n"
    f"{faq_text}\n"
    "## Technical Articles & Guides (%d Published)\n"
) % len(posts) + '\n'.join(f"### {p['title']}\n- URL: {SITE_URL}/blog/{p['slug']}.html\n- Date: {p['date']}\n- Description: {p['desc']}\n- Keywords: {', '.join(p['tags'])}\n" for p in posts)
wr('llms-full.txt', llms_full_txt)

wr('rss.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>%s Blog</title><link>%s/blog.html</link><description>AI, LLM and data engineering</description>\n' % (AUTHOR, SITE_URL) +
   ''.join('<item><title>%s</title><link>%s/blog/%s.html</link><guid>%s/blog/%s.html</guid><pubDate>%s</pubDate><description>%s</description></item>\n' % (
       E(p['title']), SITE_URL, p['slug'], SITE_URL, p['slug'], datetime.datetime.strptime(p['date'], '%Y-%m-%d').strftime('%a, %d %b %Y 00:00:00 +0000'), E(p['desc'])) for p in posts) + '</channel></rss>\n')
for u, t, d in serp:
    if len(t) > 62: print('WARN title may be cut in Google (%d chars): %s' % (len(t), t))
    if not 110 <= len(d) <= 160: print('WARN description is %d chars (aim 110-160): %s' % (len(d), u))
print('Built %d posts, %d URLs in sitemap. SITE_URL = %s' % (len(posts), len(urls), SITE_URL))
