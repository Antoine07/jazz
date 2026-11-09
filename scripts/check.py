from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re
root=Path(__file__).resolve().parents[1]/'docs'
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.links=[];self.headings=0;self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.headings+=1
        for k in ('href','src'):
            if a.get(k):self.links.append(a[k])
        if tag=='img':self.images.append(a)
errors=[];pages={}
for file in root.glob('*.html'):
    p=Page();p.feed(file.read_text());pages[file]=p
    if p.headings!=1:errors.append(f'{file.name}: h1 count {p.headings}')
    if len(p.ids)!=len(set(p.ids)):errors.append(f'{file.name}: duplicate ids')
    if any('alt' not in a for a in p.images):errors.append(f'{file.name}: missing image alternative')
for file,p in pages.items():
    for raw in p.links:
        url=urlsplit(raw)
        if url.scheme or url.netloc:continue
        target=file.parent/unquote(url.path) if url.path else file
        if not target.exists():errors.append(f'{file.name}: missing {raw}')
        elif url.fragment and target.suffix=='.html':
            other=pages.get(target)
            if other and url.fragment not in other.ids:errors.append(f'{file.name}: missing fragment {raw}')
count=sum(f.read_text().count('class="exercise"') for f in pages)
if count!=47:errors.append(f'Expected 47 exercises, found {count}')
quiz=(root/'pratique.html').read_text()
if quiz.count('<fieldset')!=10:errors.append('Expected ten quiz questions')
if len(pages)!=14:errors.append('Expected fourteen pages')
for file,p in pages.items():
    content=file.read_text()
    if file.name!='index.html' and 'Ténor Si♭ · notes et accords écrits' not in content:errors.append(f'{file.name}: missing tenor convention')
    if any(phrase in content.lower() for phrase in ['votre photo','votre feuille','notation photo']):errors.append(f'{file.name}: conversational wording')
for f in root.rglob('*'):
    if f.is_file() and f.suffix in ['.html','.css','.js','.json']:
        copy=root.parent/'dist'/f.relative_to(root)
        if not copy.exists():errors.append(f'Missing deployment copy: {f}')
        elif copy.read_bytes()!=f.read_bytes():errors.append(f'Deployment copy differs: {f}')
if errors:raise SystemExit('\n'.join(errors))
print(f'OK : {len(pages)} pages, {count} exercices, 10 QCM, liens et ancres internes valides.')
