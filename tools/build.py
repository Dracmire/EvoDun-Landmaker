import json,pathlib
r=pathlib.Path(__file__).resolve().parent.parent
d=json.loads((r/'data/snake_mountain.json').read_text())
d2=json.loads((r/'data/snake_mountain_surface.json').read_text())
d3=json.loads((r/'data/shrine_pier.json').read_text())
d4=json.loads((r/'data/shrine_pier_x4.json').read_text())
(r/'data/packs.js').write_text('window.EVO_PACKS={snake_mountain:'+json.dumps(d,separators=(',',':'))+',snake_mountain_surface:'+json.dumps(d2,separators=(',',':'))+',shrine_pier:'+json.dumps(d3,separators=(',',':'))+',shrine_pier_x4:'+json.dumps(d4,separators=(',',':'))+'};\n')
body=(r/'src/app.html').read_text()
js=''.join((r/f'src/{n}.js').read_text()+'\n' for n in ['png','fields','shape','rooms','roomtypes','pocket','tech','render','contract'])
packs=(r/'data/packs.js').read_text()
ui=(r/'src/ui.js').read_text()
# artifact fragment (no doctype/html/head/body)
(r/'dist/viewer.html').write_text(body+'\n<script>\n'+packs+js+ui+'</script>\n')
# repo index.html
(r/'index.html').write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'+body.split('<div class="app">')[0]+'</head><body>\n<div class="app">'+body.split('<div class="app">',1)[1]+'\n<script src="data/packs.js"></script>\n<script src="src/png.js"></script>\n<script src="src/fields.js"></script>\n<script src="src/shape.js"></script>\n<script src="src/rooms.js"></script>\n<script src="src/roomtypes.js"></script>\n<script src="src/pocket.js"></script>\n<script src="src/tech.js"></script>\n<script src="src/render.js"></script>\n<script src="src/contract.js"></script>\n<script src="src/ui.js"></script>\n</body></html>\n')
print('ok',(r/'dist/viewer.html').stat().st_size)
