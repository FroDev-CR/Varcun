from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json
import pdfplumber

root = Path(__file__).resolve().parents[1]
tmp = root / 'tmp/catalog'
pages = json.loads((tmp / 'manifest.json').read_text(encoding='utf-8'))
chosen = []
for page in pages:
    if len(page['text']) < 250 or page['page'] in [4,5,14,27,29,39,43,46,50,55,61,64,66,75,80]:
        for asset in page['images']:
            p = tmp / asset['file']
            im = Image.open(p)
            if min(im.size) >= 150:
                chosen.append(p)
cols, cell_w, cell_h = 6, 190, 180
sheet = Image.new('RGB',(cols*cell_w, ((len(chosen)+cols-1)//cols)*cell_h),'#e7ecef')
draw = ImageDraw.Draw(sheet)
for i,p in enumerate(chosen):
    x,y = i%cols*cell_w,i//cols*cell_h
    im=Image.open(p).convert('RGBA')
    back=Image.new('RGBA', im.size, 'white')
    back.alpha_composite(im)
    thumb=ImageOps.contain(back.convert('RGB'),(180,150))
    sheet.paste(thumb,(x+(cell_w-thumb.width)//2,y))
    draw.text((x+5,y+153),p.name[:27],fill='black')
sheet.save(tmp/'contact-sheet.jpg')
with pdfplumber.open(next(root.glob('*.pdf'), root / 'public/catalogo-2026.pdf')) as pdf:
    data=[]
    for i,page in enumerate(pdf.pages,1):
        text=page.extract_text(x_tolerance=5) or ''
        data.append({'page':i,'text':text})
    (tmp/'readable.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('Contact sheet:',len(chosen),'images')
print('Sections:',[(p['page'],p['text'].replace('\n',' ')[:160]) for p in data if len(p['text'])<300])
