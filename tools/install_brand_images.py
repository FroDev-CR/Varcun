"""Convert the generated Varcun photographs to WebP for the website."""
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
NAMES=('botellas','vasos','oficina','bolsas','gorras','maletines','electronicos','eco')
for name in NAMES:
    source=ROOT/'artifacts/imagegen'/f'{name}-varcun.png'
    target=ROOT/'public/images'/f'{name}-varcun.webp'
    im=Image.open(source).convert('RGB')
    im.save(target,'WEBP',quality=88,method=6)
    print(f'{target.name}: {im.width}x{im.height}, {target.stat().st_size} bytes')
cover=Image.open(ROOT/'output/pdf/previews/portada.png').convert('RGB')
cover.save(ROOT/'public/images/catalogo-varcun-2026-cover.webp','WEBP',quality=90,method=6)
