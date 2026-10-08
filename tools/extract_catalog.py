from pathlib import Path
from pypdf import PdfReader
import json

root = Path(__file__).resolve().parents[1]
pdf = next(root.glob('*.pdf'), root / 'public/catalogo-2026.pdf')
reader = PdfReader(pdf)
out = root / 'tmp' / 'catalog'
out.mkdir(parents=True, exist_ok=True)
pages = []
for n, page in enumerate(reader.pages, 1):
    text = page.extract_text() or ''
    (out / f'page-{n:02}.txt').write_text(text, encoding='utf-8')
    assets = []
    for i, img in enumerate(page.images):
        name = f'page-{n:02}-image-{i:02}{Path(img.name).suffix}'
        (out / name).write_bytes(img.data)
        assets.append({'file': name, 'size': len(img.data)})
    pages.append({'page': n, 'text': text, 'images': assets})
    print(f'PAGE {n}: {text[:900]} | IMAGES {len(assets)}')
(out / 'manifest.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'TOTAL: {len(pages)} pages')
