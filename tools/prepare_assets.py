from pathlib import Path
from PIL import Image
import shutil

root=Path(__file__).resolve().parents[1]
source=root/'tmp/catalog'
out=root/'public/images'
out.mkdir(parents=True,exist_ok=True)
lifestyle={'oficina':3,'lapiceros':12,'botellas':20,'vasos':28,'llaveros':34,'gorras':39,'maletines':44,'bolsas':53,'electronicos':58,'herramientas':64,'sublimacion':68,'eco':71,'otros':79}
for name,page in lifestyle.items():
    p=next(source.glob(f'page-{page:02}-image-01.*'))
    im=Image.open(p)
    im.save(out/f'{name}.webp','WEBP',quality=90)
products={'libreta-nature':(4,0),'libreta-coffee':(5,0),'lapicero-bambu':(14,0),'botella-termica':(27,4),'vaso-termico':(29,2),'gorra-luxfit':(43,4),'lonchera':(50,4),'bolsa-manta':(75,5),'herramientas':(66,1),'bbq':(80,0),'vino':(80,2),'sublimacion':(69,1)}
for name,(page,index) in products.items():
    p=next(source.glob(f'page-{page:02}-image-{index:02}.*'))
    im=Image.open(p)
    im.save(out/f'producto-{name}.webp','WEBP',quality=92)
input_pdf=next(root.glob('*.pdf'),root/'public/catalogo-2026.pdf')
if input_pdf != root/'public/catalogo-2026.pdf':
    shutil.copyfile(input_pdf,root/'public/catalogo-2026.pdf')
print('Prepared',len(lifestyle),'category photographs and',len(products),'product photographs.')
