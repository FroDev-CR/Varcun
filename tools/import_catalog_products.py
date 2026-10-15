"""Import the verified PDF inventory and its original product photographs.

Requires the original PDF and output/pdf/Inventario-y-verificacion.json from
the catalogue reconstruction. Generated web data and images are committed.
"""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageOps
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = {
    3: 'oficina', 12: 'lapiceros', 20: 'botellas', 28: 'vasos',
    34: 'llaveros', 39: 'gorras', 44: 'maletines', 53: 'bolsas',
    58: 'electronicos', 64: 'herramientas', 68: 'sublimacion',
    71: 'eco', 79: 'otros',
}
CODE = re.compile(r'\b[A-Z]{2}-\d{4}\b')
EXTRA_CATEGORIES = {
    'AO-2601': ['eco'],       # The PDF explicitly marks Nature as ecological.
    'BP-2505': ['bolsas'],    # Cycling bag appears in the travel section.
    'OT-2604': ['oficina'],   # Colour pencils also belong with office articles.
    'MU-1801': ['llaveros'],  # The product is a multifunction key ring.
}


def clean(value):
    return ' '.join(value.split())


def import_products():
    source = next(ROOT.glob('*.pdf'))
    assert hashlib.sha256(source.read_bytes()).hexdigest() == '4bf7350973254b2a5c0f0aeac52861488ccb25f485173c2e602e0f98e2a47574'
    inventory = json.loads((ROOT / 'output/pdf/Inventario-y-verificacion.json').read_text(encoding='utf-8'))
    pdf = PdfReader(source)
    published = PdfReader(ROOT / 'public/catalogo-varcun-2026.pdf')
    assert len(pdf.pages) == len(published.pages) == len(inventory['pages']) == 81
    image_dir = ROOT / 'public/images/catalogo'
    image_dir.mkdir(parents=True, exist_ok=True)
    products = {}
    photo_sources = {}
    pdf_membership = {}

    for record in inventory['pages']:
        number = record['page']
        if not record['products']:
            continue
        # Check the inventory against the actual PDF served by the website.
        pdf_codes = CODE.findall(published.pages[number - 1].extract_text())
        assert Counter(pdf_codes) == Counter(record['codes']), (number, pdf_codes, record['codes'])
        category = SECTIONS[max(start for start in SECTIONS if start < number)]
        page_images = {image.indirect_reference.idnum: image for image in pdf.pages[number - 1].images if image.indirect_reference}
        for item in record['products']:
            code = item['code']
            pdf_membership.setdefault(category, {})[code] = number
            if code in products:
                products[code]['pages'][category] = number
                continue
            fields = {clean(field['label']): clean(field['value']) for field in item['fields']}
            dimensions = fields.get('Dimensiones aproximadas', '')
            capacity = fields.get('Capacidad de almacenaje', '')
            detail = ' · '.join(value for value in [capacity, dimensions] if value and not re.fullmatch(r'-+', value))
            description = clean(item['description'])
            products[code] = {
                'code': code,
                'name': clean(item['name']),
                'category': category,
                'description': description,
                'detail': detail,
                'technique': fields.get('Técnica de impresión', '').replace(' | ', ' / '),
                'page': number,
                'pages': {category: number},
                'image': f'catalogo/{code.lower()}',
            }
            # These are existing product photographs, not generated substitutes.
            candidates = []
            for xref in item['photos']:
                image = page_images[xref].image.convert('RGBA')
                bounds = image.getchannel('A').getbbox()
                if bounds:
                    image = image.crop(bounds)
                candidates.append((image.width * image.height, xref, image))
            assert candidates, code
            _, xref, image = max(candidates, key=lambda value: value[0])
            image.thumbnail((720, 720), Image.Resampling.LANCZOS)
            image.save(image_dir / f'{code.lower()}.webp', 'WEBP', quality=88, method=6)
            photo_sources[code] = {'page': number, 'source_xref': xref, 'size': image.size}

    for code, categories in EXTRA_CATEGORIES.items():
        for category in categories:
            products[code]['pages'].setdefault(category, products[code]['page'])
    for product in products.values():
        product['categories'] = list(product['pages'])
    assert len(products) == 110
    dataset = list(products.values())
    generated = '// Generated from the verified Varcun 2026 PDF inventory.\n'
    generated += '// One entry per reference; pages retains every category occurrence.\n'
    generated += 'export type CatalogProduct = { code: string; name: string; category: string; categories: string[]; description: string; detail: string; technique: string; page: number; pages: Record<string, number>; image: string };\n'
    generated += 'export const catalogProducts: CatalogProduct[] = ' + json.dumps(dataset, ensure_ascii=False, indent=2) + ';\n'
    (ROOT / 'server/catalog-data.ts').write_text(generated, encoding='utf-8')

    artifacts = ROOT / 'artifacts'
    artifacts.mkdir(exist_ok=True)
    report = {
        'unique_products': len(products),
        'pdf_records': sum(len(row['products']) for row in inventory['pages']),
        'pdf_categories': pdf_membership,
        'web_counts': {category: sum(category in item['categories'] for item in dataset) for category in SECTIONS.values()},
        'photo_sources': photo_sources,
        'total_photo_bytes': sum(path.stat().st_size for path in image_dir.glob('*.webp')),
    }
    (artifacts / 'complete-catalog-import.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    # Compact contact sheets make it possible to check every reference visually.
    for start in range(0, len(dataset), 30):
        batch = dataset[start:start + 30]
        sheet = Image.new('RGB', (6 * 175, ((len(batch) + 5) // 6) * 188), '#edf2f3')
        draw = ImageDraw.Draw(sheet)
        for index, item in enumerate(batch):
            photo = Image.open(image_dir / f"{item['code'].lower()}.webp")
            thumb = ImageOps.contain(photo, (155, 150))
            x, y = index % 6 * 175, index // 6 * 188
            sheet.paste(thumb, (x + (175 - thumb.width) // 2, y + 4 + (150 - thumb.height) // 2), thumb if thumb.mode == 'RGBA' else None)
            draw.text((x + 10, y + 160), item['code'], fill='#092a49')
        sheet.save(artifacts / f'catalog-products-contact-{start // 30 + 1}.jpg', quality=90)
    print(json.dumps({key: report[key] for key in ['unique_products', 'pdf_records', 'web_counts', 'total_photo_bytes']}))


if __name__ == '__main__':
    import_products()
