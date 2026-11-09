"""Verarbeitet die aus Canva exportierten Seiten zu Spielgrafiken.
Aufruf: python3 scripts/process-art.py ORDNER_MIT_SEITEN
Erwartete Reihenfolge der Seiten (1.png, 2.png, ...): cafe, park, club, hall, home, station, heinz-Figurenblatt.
Stellt den einfarbigen Hintergrund frei, schneidet zu, verkleinert und speichert WebP in src/assets."""
import subprocess
import sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
cut = Path(__file__).resolve().parent / 'cutout.py'
tmp = src / '_cut'
tmp.mkdir(exist_ok=True)
pages = sorted(src.glob('*.png'), key=lambda p: int(''.join(c for c in p.stem if c.isdigit()) or 0))
buildings = ['cafe', 'park', 'club', 'hall', 'home', 'station']
moods = ['neutral', 'happy', 'worried', 'thinking']

def webp(png: Path, dest: Path, width=None, height=None):
    im = Image.open(png)
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if height and im.height > height:
        im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, 'WEBP', quality=86, method=6)
    print(dest.relative_to(root), im.size, dest.stat().st_size // 1024, 'KB')

for name, page in zip(buildings, pages):
    subprocess.run([sys.executable, '-I', str(cut), str(page), str(tmp / name)], check=True)
    webp(tmp / f'{name}.png', root / 'src/assets/city' / f'{name}.webp', width=360)

if len(pages) > 6:
    subprocess.run([sys.executable, '-I', str(cut), str(pages[6]), str(tmp / 'heinz'), '--split', '4'], check=True)
    for i, mood in enumerate(moods):
        webp(tmp / f'heinz-{i + 1}.png', root / 'src/assets/opponents' / f'heinz-{mood}.webp', height=420)
