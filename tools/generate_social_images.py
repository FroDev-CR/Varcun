"""Render square sharing cards from the existing Varcun vector mark and product photos.

Requires Pillow. Fonts may be supplied explicitly on systems without Segoe UI.
Generated JPEGs are committed; production builds need no image dependencies.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
NAVY = '#092a49'
AQUA = '#08bfc4'
SIZE = 800

def mark(image, x, y, size):
    # Same 48-unit vector paths, round caps and joins as public/logo-mark.svg.
    scale = 4
    tile = Image.new('RGB', (size * scale, size * scale), NAVY)
    draw = ImageDraw.Draw(tile)
    factor = size * scale / 48
    for points, width, color in [([(7, 10), (18, 28), (24, 28), (39, 10)], 6, AQUA), ([(13, 22), (24, 37), (35, 22)], 4, 'white')]:
        xy = [(round(a * factor), round(b * factor)) for a, b in points]
        stroke = round(width * factor)
        draw.line(xy, fill=color, width=stroke, joint='curve')
        radius = stroke / 2
        for a, b in xy:
            draw.ellipse((a-radius, b-radius, a+radius, b+radius), fill=color)
    image.paste(tile.resize((size, size), Image.Resampling.LANCZOS), (x, y))

def centered(draw, text, y, font, fill):
    draw.text((SIZE / 2, y), text, font=font, fill=fill, anchor='mt')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', default='C:/Windows/Fonts/segoeui.ttf')
    parser.add_argument('--bold-font', default='C:/Windows/Fonts/seguisb.ttf')
    args = parser.parse_args()
    font = lambda size: ImageFont.truetype(args.font, size)
    bold = lambda size: ImageFont.truetype(args.bold_font, size)
    output = ROOT / 'public/images/compartir'
    output.mkdir(parents=True, exist_ok=True)
    brand = Image.new('RGB', (SIZE, SIZE), NAVY)
    draw = ImageDraw.Draw(brand)
    mark(brand, 235, 120, 330)
    centered(draw, 'V A R C U N', 492, bold(76), 'white')
    centered(draw, 'Tu idea, nuestra impresión.', 613, font(29), '#b7f0ed')
    draw.rounded_rectangle((350, 701, 450, 708), radius=3, fill=AQUA)
    brand.save(output / 'varcun-v1.jpg', quality=92, optimize=True, subsampling=0)
    source = (ROOT / 'server/catalog-data.ts').read_text(encoding='utf-8')
    products = json.loads(source.split('export const catalogProducts: CatalogProduct[] = ', 1)[1].strip().removesuffix(';'))
    for product in products:
        card = Image.new('RGB', (SIZE, SIZE), 'white')
        draw = ImageDraw.Draw(card)
        draw.rectangle((0, 0, SIZE, 103), fill=NAVY)
        mark(card, 35, 19, 65)
        draw.text((116, 35), 'V A R C U N', font=bold(27), fill='white')
        draw.text((SIZE - 37, 37), product['code'], font=bold(25), fill='#b7f0ed', anchor='rt')
        source_photo = Image.open(ROOT / f"public/images/{product['image']}.webp").convert('RGBA')
        photo = Image.alpha_composite(Image.new('RGBA', source_photo.size, 'white'), source_photo).convert('RGB')
        photo = ImageOps.contain(photo, (630, 490), Image.Resampling.LANCZOS)
        card.paste(photo, ((SIZE - photo.width) // 2, 133 + (490 - photo.height) // 2))
        name_font = bold(34)
        words = product['name'].split()
        lines = ['']
        for word in words:
            candidate = (lines[-1] + ' ' + word).strip()
            if draw.textlength(candidate, font=name_font) > 710 and lines[-1]:
                lines.append(word)
            else:
                lines[-1] = candidate
        for index, line in enumerate(lines):
            centered(draw, line, 646 + index * 43, name_font, NAVY)
        centered(draw, 'Personalízalo con tu marca · varcun.com', 757, font(21), '#557181')
        card.save(output / f"{product['code'].lower()}-v1.jpg", quality=88, optimize=True)
    print(f'Rendered {len(products) + 1} sharing cards, 800 × 800 JPEG.')

if __name__ == '__main__':
    main()
