import json, os, re
from bs4 import BeautifulSoup
SRC='/tmp/adc-scrape'
OUT=os.path.join(os.path.dirname(__file__),'..','src','data')
urls=[u.strip() for u in open(os.path.join(SRC,'news_urls.txt')) if u.strip()]
SKIP={'','​','|'}
def plain(el):
    return re.sub(r'\s+',' ',el.get_text(' ',strip=True)).strip()
items=[]
for idx,u in enumerate(urls):
    fn=os.path.join(SRC,'articles',f'{idx:02d}.html')
    if not os.path.exists(fn) or os.path.getsize(fn)<50000: continue
    soup=BeautifulSoup(open(fn,encoding='utf-8',errors='replace').read(),'lxml')
    main=soup.find('main')
    if not main: continue
    rts=main.select('[data-testid="richTextElement"]')
    texts=[' '.join(plain(r) for r in rt.find_all(['h1'])) for rt in rts]
    title=''
    for rt in rts:
        h=rt.find('h1')
        if h and plain(h): title=plain(h); break
    if not title:
        mt=soup.find('meta',property='og:title')
        title=mt['content'].replace(' | ADC','').replace('  | ADC','').strip() if mt else ''
    author=date=excerpt=''
    body=[]
    seen_title=False
    for rt in rts:
        for el in rt.find_all(['h1','h2','h3','h4','p','ul','ol']):
            if el.name=='p' and el.find_parent(['ul','ol']): continue
            if el.name in ('ul','ol'):
                its=[plain(li) for li in el.find_all('li',recursive=False)]
                its=[i for i in its if i not in SKIP]
                if its: body.append({'type':'list','items':its})
                continue
            t=plain(el)
            if t in SKIP: continue
            if el.name=='h1':
                if not seen_title and t==title: seen_title=True; continue
                body.append({'type':'h2','text':t}); continue
            if re.match(r'^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}',t):
                date=t; continue
            if el.name=='p' and not author and len(t)<40 and ('Zubarev' in t or 'Salarin' in t or t=='Ivo'):
                author=t; continue
            body.append({'type':el.name,'text':t})
    # first paragraph as excerpt
    for b in body:
        if b['type']=='p' and len(b['text'])>40: excerpt=b['text']; break
    # article body lives in the RichContentViewer, not richTextElement
    for rc in main.select('[class*="RichContentViewer"]'):
        for el in rc.find_all(['h1','h2','h3','h4','p','ul','ol']):
            if el.name=='p' and el.find_parent(['ul','ol']): continue
            if el.name in ('ul','ol'):
                its=[plain(li) for li in el.find_all('li',recursive=False)]
                its=[i for i in its if i not in SKIP]
                if its: body.append({'type':'list','items':its})
                continue
            t=plain(el)
            if t in SKIP: continue
            body.append({'type':'h2' if el.name=='h1' else el.name,'text':t})
    img=None
    for w in main.select('wow-image'):
        info=w.get('data-image-info')
        if not info: continue
        try: d=json.loads(info)
        except: continue
        uri=d.get('imageData',{}).get('uri')
        alt=(w.find('img').get('alt') if w.find('img') else '') or ''
        if uri and ('79b064_8dd843' not in uri and '79b064_8175de' not in uri and '79b064_09dff7' not in uri):
            img={'uri':uri,'alt':alt}; break
    slug=u.split('/news/')[1]
    items.append({'slug':slug,'url':u,'title':title,'author':author,'date':date,'excerpt':excerpt,'image':img,'body':body})
json.dump(items,open(os.path.join(OUT,'articles.json'),'w'),indent=1)
print(len(items))
for i in items[:4]: print(i['date'],'|',i['author'],'|',i['title'][:50],'|',len(i['body']),'|',bool(i['image']))
