"""LEGO pass 3: one SHEET per room with the shots side by side (Mid | lego, or Mid | Rest | Scale), rows k0 / k4 / k8. Needs Pillow.
   python3 tools/lego3_sheets.py <shotsDir> <outDir>"""
import sys, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
SETS = {'perfil_u1_cam6': ['mid', 'lego'], 'perfil_u1_cam7': ['mid', 'lego'], 'perfil_u2_cam6': ['mid', 'rest', 'scale'], 'perfil_m1_cam6': ['mid', 'lego'], 'perfil_s1_cam6': ['mid', 'lego'], 'perfil_l1_cam6': ['mid', 'lego']}
SCALE = 0.5
for name, variants in SETS.items():
    rows = []
    for k in (0, 4, 8):
        ims = []
        for v in variants:
            f = os.path.join(src, f'{name.rsplit("_", 1)[0]}_{name.rsplit("_", 1)[1]}_{v}_k{k}.png')
            if not os.path.exists(f): ims = None; break
            im = Image.open(f).convert('RGB'); im = im.resize((int(im.width * SCALE), int(im.height * SCALE)), Image.LANCZOS); ims.append(im)
        if ims: rows.append(ims)
    if not rows: continue
    w, h = rows[0][0].size; pad = 4; top = 22
    sheet = Image.new('RGB', (len(variants) * (w + pad) + pad, top + len(rows) * (h + pad) + pad), (20, 20, 24)); d = ImageDraw.Draw(sheet)
    for c, v in enumerate(variants): d.text((pad + c * (w + pad) + 6, 6), f'{name}  ·  {v}', fill=(235, 235, 235))
    for r, ims in enumerate(rows):
        for c, im in enumerate(ims): sheet.paste(im, (pad + c * (w + pad), top + pad + r * (h + pad)))
    sheet.save(os.path.join(out, f'lamina_{name}.png'), optimize=True); print('wrote', name, sheet.size)
