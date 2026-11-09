"""Figurenblatt (vier Figuren nebeneinander) zu vier Ausdrücken verarbeiten.
Aufruf: python3 -I scripts/process-sheet.py BLATT.png NAME
Speichert src/assets/opponents/NAME-{neutral,happy,worried,thinking}.webp.
Reihenfolge auf dem Blatt: neutral, freut sich, besorgt, nachdenklich."""
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

sheet, name = Path(sys.argv[1]), sys.argv[2]
here = Path(__file__).resolve().parent
root = here.parent
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run([sys.executable, '-I', str(here / 'cutout.py'), str(sheet), f'{tmp}/fig', '--split', '4'], check=True)
    for i, mood in enumerate(['neutral', 'happy', 'worried', 'thinking']):
        im = Image.open(f'{tmp}/fig-{i + 1}.png')
        if im.height > 420:
            im = im.resize((round(im.width * 420 / im.height), 420), Image.LANCZOS)
        dest = root / 'src/assets/opponents' / f'{name}-{mood}.webp'
        im.save(dest, 'WEBP', quality=86, method=6)
        print(dest.relative_to(root), im.size)
