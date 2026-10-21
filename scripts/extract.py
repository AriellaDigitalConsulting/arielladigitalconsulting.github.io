"""Extract ordered content blocks (text + images) from downloaded Wix pages."""
import json, os, re
from bs4 import BeautifulSoup

SRC = '/tmp/adc-scrape/prod'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data')
SKIP = {'', '​', '|', 'top of page', 'bottom of page'}

def plain(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).strip()

def page_blocks(path):
    soup = BeautifulSoup(open(path, encoding='utf-8', errors='replace').read(), 'lxml')
    main = soup.find('main')
    if main is None:
        return None
    out, seen_img = [], set()
    nodes = main.find_all(['h1','h2','h3','h4','h5','h6','p','ul','ol','wow-image'])
    for el in nodes:
        if el.name == 'wow-image':
            info = el.get('data-image-info')
            if not info:
                continue
            try:
                d = json.loads(info)
            except Exception:
                continue
            uri = (d.get('imageData') or {}).get('uri')
            if not uri or uri in seen_img:
                continue
            seen_img.add(uri)
            img = el.find('img')
            out.append({'type': 'image', 'uri': uri,
                        'alt': (img.get('alt') if img else '') or ''})
            continue
        if el.find_parent('wow-image'):
            continue
        if el.name == 'p':
            # skip plain paragraphs nested in lists
            if el.find_parent(['ul', 'ol']):
                continue
        if el.name in ('ul', 'ol'):
            items = [plain(li) for li in el.find_all('li', recursive=False)]
            items = [i for i in items if i not in SKIP]
            if items:
                out.append({'type': 'list', 'items': items})
            continue
        t = plain(el)
        if t in SKIP:
            continue
        out.append({'type': el.name, 'text': t})
    links = [{'href': a['href'], 'text': plain(a)} for a in main.find_all('a', href=True)]
    return {'blocks': out, 'links': links}

if __name__ == '__main__':
    pages = {}
    for fn in sorted(os.listdir(SRC)):
        slug = fn[:-5]
        if slug == 'www.adc.dev':
            slug = 'index'
        p = page_blocks(os.path.join(SRC, fn))
        if p:
            pages[slug] = p
    json.dump(pages, open(os.path.join(OUT, 'pages.json'), 'w'), indent=1)
    print('pages', len(pages))
    for k in sorted(pages):
        n = len(pages[k]['blocks'])
        imgs = sum(1 for b in pages[k]['blocks'] if b['type'] == 'image')
        print(f'  {k:42} {n:3} blocks {imgs} imgs')
