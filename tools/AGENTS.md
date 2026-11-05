# tools/ —— 本项目全部一次性脚本的交接说明

覆盖工具（改脚本前先读这里）：

| 文件 | 作用 |
|---|---|
| `cutout.py` | 把白底立绘抠成带 alpha 的 WebP |
| `build_single.py` | 把整站内联成单个 HTML，供离线分发 |

## 前置条件

- Windows + PowerShell 5.1；Python 3.11（PATH 里的 `python`）。
- `cutout.py` 依赖 `opencv-python`、`numpy`、`Pillow`（本机已装：cv2 4.8.1 / numpy 1.26.4 / Pillow 10.4.0）。
- `build_single.py` 只用标准库。
- 两个脚本都用绝对路径推导项目根（`os.path.dirname(os.path.dirname(__file__))`），因此**在任意目录用绝对路径调用都能跑**，不要改成相对 CWD。

## cutout.py

- 输入：`assets/src-tall.jpg`、`src-mid.jpg`、`src-chibi.jpg`（白底原图，文件名写在 `JOBS` 里）。
- 输出：`assets/char-tall.webp` / `char-mid.webp` / `char-chibi.webp`（RGBA，长边缩放到 1500/1500/1100）。
- 做法：从四边以近白像素为种子做 OpenCV 洪水填充标出背景 → alpha 取反 → 腐蚀 1px 去掉白边 → 5×5 高斯羽化 → 对边缘做一次由内向外取色的“去污” → 裁掉透明边 → `Image.LANCZOS` 缩放 → 存 WebP(q=92)。
- 安全调用：`python tools\cutout.py`（会覆盖同名 webp，先备份再跑）。
- 已知限制：只对被**发丝围合**的白色空洞无效（洪水填充到不了），那些区域仍是纯白；当前靠页面的亮色“光池”背景掩盖。
- 验证：跑完看输出尺寸与体积；或打开 `assets/char-*.webp` 贴在深色底上看边缘。

## build_single.py

- 输入：项目根的 `index.html` + `src/css/style.css` + `src/js/story.js` + `src/js/game.js` + `assets/char-*.webp`。
- 输出：`dist/dafeiyu-vn.html`（单文件，约 776 KB）。
- 做法：正则替换 `<link rel=stylesheet>`、`<script src=...>` 与外链立绘，立绘转 `data:image/webp;base64`。
- 安全调用：`python tools\build_single.py`（幂等，会覆盖 dist 里的旧文件）。
- 验证：脚本末尾会打印体积与残留外链；正常应只剩「关于」弹层里两个 https 文档链接。
- 已实测：`file:///D:/11/Projects/dafeiyu-vn/dist/dafeiyu-vn.html` 在 Chromium 里可正常开局，无 pageerror。

## 当前未决项

- 若 `story.js` 里出现 `</script>` 字样会被内联打断；现在没有，改剧本时需留意。
- 尚未把两个脚本接进 CI；Pages 发布用的是仓库根目录的静态文件，不依赖构建。
