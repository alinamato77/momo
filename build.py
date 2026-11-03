"""Build the two pages from src/momo.html.

  index.html            website version: loads Momo from the Spline scene
  prototype/index.html  prototype: uses the bundled model file (no Spline needed)

Run: python3 build.py
"""
import base64, pathlib

ROOT = pathlib.Path(__file__).parent
SPLINE_SCENE = "https://prod.spline.design/GA7oYNDm83hS4Dfl/scene.splinecode"

src = (ROOT / "src/momo.html").read_text()
puffy = (ROOT / "src/puffy.js").read_text()
head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<style>body{margin:0}[hidden]{display:none!important}</style>\n')

def page(body):
    i = body.index('<header class="top">')
    return head + body[:i] + '</head>\n<body>\n' + body[i:] + '\n</body>\n</html>\n'

# website version: everything inline, Momo comes from Spline
still = "data:image/png;base64," + base64.b64encode((ROOT / "prototype/momo-still.png").read_bytes()).decode()
site = src.replace('<script src="puffy.js"></script>',
                   '<script>\n' + puffy + '</script>\n<script>window.MOMO_SPLINE="' + SPLINE_SCENE + '";</script>')
site = site.replace('src="momo-still.png"', 'src="' + still + '"')
(ROOT / "index.html").write_text(page(site))

# prototype: model file + puffy.js sit next to the page
(ROOT / "prototype/puffy.js").write_text(puffy)
(ROOT / "prototype/index.html").write_text(page(src))
print("built index.html and prototype/index.html")
