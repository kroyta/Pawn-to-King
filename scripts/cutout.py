"""Einfarbigen Hintergrund entfernen (Flutfüllung von den Rändern), zuschneiden, optional in Figuren zerlegen.
Aufruf: cutout.py EINGABE AUSGABE_PRÄFIX [--split N] [--width W]"""
import sys
from collections import deque
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
split = int(sys.argv[sys.argv.index('--split') + 1]) if '--split' in sys.argv else 1
width = int(sys.argv[sys.argv.index('--width') + 1]) if '--width' in sys.argv else 0
TOL, SOFT = 28, 22

im = Image.open(src).convert('RGBA')
W, H = im.size
px = im.load()
edge = [px[x, 0] for x in range(W)] + [px[x, H - 1] for x in range(W)] + [px[0, y] for y in range(H)] + [px[W - 1, y] for y in range(H)]
bg = tuple(sorted(c[i] for c in edge)[len(edge) // 2] for i in range(3))
dist = lambda c: max(abs(c[0] - bg[0]), abs(c[1] - bg[1]), abs(c[2] - bg[2]))

alpha = Image.new('L', (W, H), 255)
a = alpha.load()
seen = bytearray(W * H)
q = deque()
for x in range(W):
    q.append((x, 0)); q.append((x, H - 1))
for y in range(H):
    q.append((0, y)); q.append((W - 1, y))
while q:
    x, y = q.popleft()
    i = y * W + x
    if seen[i]:
        continue
    seen[i] = 1
    d = dist(px[x, y])
    if d > TOL + SOFT:
        continue
    a[x, y] = 0 if d <= TOL else int(255 * (d - TOL) / SOFT)
    if d <= TOL:
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx]:
                q.append((nx, ny))
alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
im.putalpha(alpha)

def save(img, name):
    box = img.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    img = img.crop(box)
    if width and img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(name, optimize=True)
    print(name, img.size)

if split == 1:
    save(im, out + '.png')
else:
    # Spalten mit Inhalt finden und in N Gruppen teilen
    A = im.getchannel('A').load()
    cols = [any(A[x, y] > 40 for y in range(0, H, 2)) for x in range(W)]
    runs, start = [], None
    for x, c in enumerate(cols + [False]):
        if c and start is None: start = x
        if not c and start is not None:
            runs.append([start, x]); start = None
    runs = [r for r in runs if r[1] - r[0] > 8]
    while len(runs) > split:  # kleinste Lücke schließen
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = gaps.index(min(gaps))
        runs[i:i + 2] = [[runs[i][0], runs[i + 1][1]]]
    print('Figuren gefunden:', len(runs))
    for n, (x0, x1) in enumerate(runs):
        save(im.crop((max(0, x0 - 4), 0, min(W, x1 + 4), H)), f'{out}-{n + 1}.png')
