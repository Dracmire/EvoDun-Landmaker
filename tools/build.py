import json,pathlib
r=pathlib.Path(__file__).resolve().parent.parent
d=json.loads((r/'data/snake_mountain.json').read_text())
d2=json.loads((r/'data/snake_mountain_surface.json').read_text())
d3=json.loads((r/'data/shrine_pier.json').read_text())
d4=json.loads((r/'data/shrine_pier_x4.json').read_text())
d5=json.loads((r/'data/snake_mountain_floors.json').read_text())
d6=json.loads((r/'data/snake_mountain_macroform.json').read_text())
(r/'data/packs.js').write_text('window.EVO_PACKS={snake_mountain:'+json.dumps(d,separators=(',',':'))+',snake_mountain_surface:'+json.dumps(d2,separators=(',',':'))+',shrine_pier:'+json.dumps(d3,separators=(',',':'))+',shrine_pier_x4:'+json.dumps(d4,separators=(',',':'))+',snake_mountain_floors:'+json.dumps(d5,separators=(',',':'))+',snake_mountain_macroform:'+json.dumps(d6,separators=(',',':'))+'};\n'+'window.EVO_REAL_PNG="'+__import__('base64').b64encode((r/'data/samples/skeleton_heightmap_256.png').read_bytes()).decode()+'";\n') # the real map (the user\'s height PNG), decoded in the viewer by the same path as a loaded file
body=(r/'src/app.html').read_text()
js=''.join((r/f'src/{n}.js').read_text()+'\n' for n in ['png','fields','shape','rooms','roomtypes','pocket','tech','curves','wallc','render','contract','floors','backdrop','controls'])
packs=(r/'data/packs.js').read_text()
ui=(r/'src/ui.js').read_text()
# artifact fragment (no doctype/html/head/body)
(r/'dist/viewer.html').write_text(body+'\n<script>\n'+packs+js+ui+'</script>\n')
# repo index.html
(r/'index.html').write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'+body.split('<div class="app">')[0]+'</head><body>\n<div class="app">'+body.split('<div class="app">',1)[1]+'\n<script src="data/packs.js"></script>\n<script src="src/png.js"></script>\n<script src="src/fields.js"></script>\n<script src="src/shape.js"></script>\n<script src="src/rooms.js"></script>\n<script src="src/roomtypes.js"></script>\n<script src="src/pocket.js"></script>\n<script src="src/tech.js"></script>\n<script src="src/curves.js"></script>\n<script src="src/wallc.js"></script>\n<script src="src/render.js"></script>\n<script src="src/contract.js"></script>\n<script src="src/floors.js"></script>\n<script src="src/backdrop.js"></script>\n<script src="src/controls.js"></script>\n<script src="src/ui.js"></script>\n</body></html>\n')
import subprocess
subprocess.run(['node',str(r/'tools/gen_controls_doc.js')],check=True)  # docs/controls.md is generated from src/controls.js
print('ok',(r/'dist/viewer.html').stat().st_size)
