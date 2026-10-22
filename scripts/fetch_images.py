"""Download any image referenced by src/data/layouts/*.json or src/data/articles.json that is missing from
src/data/images.json, convert it to WebP under public/images and register it.
Run from the repo root: python3 scripts/fetch_images.py"""
import glob, hashlib, io, json, re, urllib.request
from PIL import Image

imgs = json.load(open('src/data/images.json'))
want = set()

def walk(n):
    if n.get('k') == 'img': want.add(n['src'])
    if (n.get('bimg') or {}).get('src'): want.add(n['bimg']['src'])
    if n.get('poster'): want.add(n['poster'])
    for c in n.get('c', []): walk(c)

for f in glob.glob('src/data/layouts/*.json'):
    d = json.load(open(f))
    for v in ('desktop', 'mobile'):
        for n in (d.get(v) or {}).get('nodes', []): walk(n)

for a in json.load(open('src/data/articles.json')):
    want.update(i for i in (a.get('thumb'), a.get('hero'), a.get('avatar')) if i)
    want.update(re.findall(r'src="wix:([^"]+)"', (a.get('html') or '') + (a.get('lead') or '')))

added = 0
for src in sorted(want - set(imgs)):
    try:
        raw = urllib.request.urlopen(f'https://static.wixstatic.com/media/{src}', timeout=30).read()
        im = Image.open(io.BytesIO(raw))
    except Exception as e:
        print('skip', src, e); continue
    name = hashlib.sha1(src.encode()).hexdigest()[:12]
    if getattr(im, 'is_animated', False):
        ext = src.rsplit('.', 1)[1]; out = f'/images/{name}.{ext}'
        open('public' + out, 'wb').write(raw)
    else:
        im = im.convert('RGBA') if im.mode in ('P', 'LA', 'RGBA') else im.convert('RGB')
        if im.width > 1800: im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
        out = f'/images/{name}.webp'; im.save('public' + out, 'WEBP', quality=82, method=6)
    imgs[src] = {'file': out, 'w': im.width, 'h': im.height}; added += 1

json.dump(imgs, open('src/data/images.json', 'w'), indent=1)
print(added, 'added,', len(want), 'referenced')
