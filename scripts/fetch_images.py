import json, os, hashlib, subprocess, re
OUT='public/images'
os.makedirs(OUT, exist_ok=True)
uris=json.load(open('/tmp/uris.json'))
manifest={}
for uri,meta in uris.items():
    if uri.startswith('http'): continue
    ext=os.path.splitext(uri.split('~')[0])[1].lstrip('.').split('?')[0] or 'png'
    name=hashlib.sha1(uri.encode()).hexdigest()[:12]+'.'+ext
    dest=os.path.join(OUT,name)
    if not os.path.exists(dest) or os.path.getsize(dest)<1000:
        subprocess.run(['curl','-sSL','--max-time','60',f'https://static.wixstatic.com/media/{uri}', '-o', dest], check=False)
    manifest[uri]={'file':f'/images/{name}','w':meta['w'],'h':meta['h']}
json.dump(manifest, open('src/data/images.json','w'), indent=1)
print(len(manifest))
