# -*- coding: utf-8 -*-
"""把项目打包成单个自包含 HTML：CSS、JS、立绘全部内联。"""
import base64
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
OUT = os.path.join(DIST, "dafeiyu-vn.html")


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


html = read(os.path.join(ROOT, "index.html"))

# 1) 内联样式
css = read(os.path.join(ROOT, "src", "css", "style.css"))
html = re.sub(
    r'<link rel="stylesheet" href="src/css/style.css">',
    lambda m: "<style>\n" + css + "\n</style>",
    html,
)

# 2) 内联脚本（按出现顺序）
for name in ("story.js", "game.js"):
    js = read(os.path.join(ROOT, "src", "js", name))
    html = re.sub(
        r'<script src="src/js/' + re.escape(name) + r'"></script>',
        lambda m, js=js: "<script>\n" + js + "\n</script>",
        html,
    )


# 3) 内联立绘
def to_data_uri(rel):
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    with open(path, "rb") as f:
        raw = f.read()
    return "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")


html = re.sub(
    r'src="(assets/char-[a-z]+\.webp)"',
    lambda m: 'src="' + to_data_uri(m.group(1)) + '"',
    html,
)

os.makedirs(DIST, exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(html)

left = re.findall(r'(?:src|href)="(?!data:)([^"]+)"', html)
print("output:", OUT)
print("size: %.0f KB" % (os.path.getsize(OUT) / 1024))
print("leftover external refs:", left or "none")
