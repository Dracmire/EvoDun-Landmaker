"""PR pend P3: one sheet per place and treatment: 4 columns (3, 5, 7, 9 terraces) x 3 rows (k0, k4, k8). usage: python3 tools/p3_sheets.py <rawDir> <outDir>"""
import sys, glob, os
from PIL import Image, ImageDraw
raw, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
combos = sorted({os.path.basename(f).rsplit('_T', 1)[0] for f in glob.glob(os.path.join(raw, '*_T3_k0.png'))})
for c in combos:
    ims = [[Image.open(os.path.join(raw, f'{c}_T{T}_k{k}.png')) for T in (3, 5, 7, 9)] for k in (0, 4, 8)]
    w, h = ims[0][0].size; s = 0.36; tw, th = int(w * s), int(h * s)
    sh = Image.new('RGB', (tw * 4, th * 3), 'white'); d = ImageDraw.Draw(sh)
    for r in range(3):
        for col in range(4):
            sh.paste(ims[r][col].resize((tw, th)), (col * tw, r * th))
            if r == 0: d.rectangle([col * tw, 0, col * tw + 62, 14], fill='black'); d.text((col * tw + 3, 1), f'{(3, 5, 7, 9)[col]} terraces', fill='white')
        d.rectangle([0, r * th, 22, r * th + 14], fill='black'); d.text((3, r * th + 1), f'k{(0, 4, 8)[r]}', fill='white')
    sh.save(os.path.join(out, f'lamina_{c}.png'))
print(len(combos), 'sheets')
