#!/usr/bin/env python3
"""Writes ONE new blog post per day from content/topics.txt.
Uses Hugging Face (HF_TOKEN, HF_MODEL, HF_BASE_URL) if HF_TOKEN is set, otherwise Claude (ANTHROPIC_API_KEY).
Optional: AUTO_DRAFT=true saves the post as a draft for review."""
import os, re, sys, json, datetime, urllib.request
ROOT = os.path.dirname(os.path.abspath(__file__))
try:  # local runs: read KEY=VALUE lines from .env (never commit this file)
    for _l in open(os.path.join(ROOT, '.env'), encoding='utf-8'):
        if '=' in _l and not _l.lstrip().startswith('#'):
            _k, _v = _l.strip().split('=', 1); os.environ.setdefault(_k.strip(), _v.strip().strip('"\''))
except FileNotFoundError:
    pass
HF = os.environ.get('HF_TOKEN')
HF_BASE = (os.environ.get('HF_BASE_URL') or 'https://router.huggingface.co/v1').rstrip('/')
HF_MODEL = os.environ.get('HF_MODEL') or 'Qwen/Qwen3-4B-Instruct-2507:fastest'
KEY = os.environ.get('ANTHROPIC_API_KEY')
MODEL = os.environ.get('CLAUDE_MODEL', 'claude-sonnet-5-5')
DRAFT = os.environ.get('AUTO_DRAFT', 'false').lower() == 'true'
TOPICS, DONE = os.path.join(ROOT, 'content/topics.txt'), os.path.join(ROOT, 'content/topics_done.txt')
POSTS = os.path.join(ROOT, 'content/posts')
today = datetime.date.today().isoformat()
if any(f.startswith(today) for f in os.listdir(POSTS)):
    print('A post for %s already exists. Nothing to do.' % today)
    sys.exit(0)
lines = open(TOPICS, encoding='utf-8').read().split('\n')
topic = next((l.strip() for l in lines if l.strip() and not l.startswith('#')), None)
if not topic: sys.exit('No topics left. Add more lines to content/topics.txt')
if not KEY and not HF: sys.exit('Set HF_TOKEN (Hugging Face) or ANTHROPIC_API_KEY.')
PROMPT = """Write a blog post for a developer-focused engineering blog, written by a senior AI and data engineer.
Topic: %s

Rules:
- 700 to 900 words, practical and accurate. Do not invent statistics, benchmarks, customer names or personal claims. If unsure, stay general.
- Output exactly this format and nothing before or after it:
---
title: <clear title that contains the main keyword>
description: <120 to 155 characters>
tags: <3 comma-separated tags>
---
<body>
- Body: a 2-sentence intro, then 3 to 5 sections using '## ' headings, '- ' bullet lists, **bold**, `inline code`, and fenced code blocks only where useful. End with a '## Takeaway' section.
- No H1, no tables, no images, no emojis.""" % topic
def post_json(url, body, headers):
    h = {'content-type': 'application/json', 'user-agent': 'blog-bot/1.0'}; h.update(headers)
    with urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(body).encode(), headers=h), timeout=180) as r:
        return json.load(r)
if HF:
    out = post_json(HF_BASE + '/chat/completions', {'model': HF_MODEL, 'messages': [{'role': 'user', 'content': PROMPT}], 'max_tokens': 3000, 'temperature': 0.6},
                    {'authorization': 'Bearer ' + HF})
    txt = out['choices'][0]['message']['content'].strip()
else:
    out = post_json('https://api.anthropic.com/v1/messages', {'model': MODEL, 'max_tokens': 3000, 'messages': [{'role': 'user', 'content': PROMPT}]},
                    {'x-api-key': KEY, 'anthropic-version': '2023-06-01'})
    txt = ''.join(b.get('text', '') for b in out['content'] if b.get('type') == 'text').strip()
txt = re.sub(r'<think>.*?</think>', '', txt, flags=re.S).strip()
txt = re.sub(r'^```(?:markdown)?\n|\n```$', '', txt)
m = re.match(r'---\n(.*?)\n---\n(.+)', txt, re.S)
if not m: sys.exit('Model output was not in the expected format; topic kept for tomorrow.')
fm = dict(l.split(':', 1) for l in m.group(1).split('\n') if ':' in l)
title, desc, tags = fm.get('title', '').strip(), fm.get('description', '').strip(), fm.get('tags', '').strip()
if not title or not desc or len(m.group(2).split()) < 400: sys.exit('Output too short or missing fields; topic kept for tomorrow.')
slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:70]
head = 'title: %s\ndescription: %s\ndate: %s\ntags: %s\n' % (title, desc, today, tags) + ('draft: true\n' if DRAFT else '')
open(os.path.join(POSTS, '%s-%s.md' % (today, slug)), 'w', encoding='utf-8').write('---\n' + head + '---\n' + m.group(2).strip() + '\n')
rest = [l for l in lines if l.strip() != topic]
open(TOPICS, 'w', encoding='utf-8').write('\n'.join(rest))
open(DONE, 'a', encoding='utf-8').write(topic + '\n')
print('Wrote post:', title, '(draft)' if DRAFT else '')
