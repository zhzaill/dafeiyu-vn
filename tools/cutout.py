# -*- coding: utf-8 -*-
"""白底立绘抠图：边界洪水填充 + 轻微收边羽化，输出 WebP(带 alpha)。"""
import os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")

JOBS = [
    ("src-tall.jpg",  "char-tall",  1500),
    ("src-mid.jpg",   "char-mid",   1500),
    ("src-chibi.jpg", "char-chibi", 1100),
]


def cutout(src_path, out_base, target_h):
    bgr = cv2.imread(src_path, cv2.IMREAD_COLOR)
    h, w = bgr.shape[:2]

    # 稍微模糊，抑制 JPEG 噪点，让洪水填充更干净
    blur = cv2.GaussianBlur(bgr, (3, 3), 0)
    mask = np.zeros((h + 2, w + 2), np.uint8)

    # 从四周开始，凡与种子像素差值很小的白区都被填成 255
    for x in range(0, w, 4):
        for y in (0, h - 1):
            if bgr[y, x].min() > 230:
                cv2.floodFill(blur.copy(), mask, (x, y), (0, 0, 0), (14, 14, 14), (14, 14, 14),
                              cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8))
    for y in range(0, h, 4):
        for x in (0, w - 1):
            if bgr[y, x].min() > 230:
                cv2.floodFill(blur.copy(), mask, (x, y), (0, 0, 0), (14, 14, 14), (14, 14, 14),
                              cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8))

    filled = mask[1:-1, 1:-1]
    alpha = np.where(filled > 0, 0, 255).astype(np.uint8)

    # 收掉 1px 白边，再羽化
    k = np.ones((3, 3), np.uint8)
    alpha = cv2.erode(alpha, k, iterations=1)
    alpha = cv2.GaussianBlur(alpha, (5, 5), 0)
    alpha = np.where(alpha < 8, 0, alpha).astype(np.uint8)

    # 透明边缘去白边：颜色向内部收缩一像素取色（简单去污）
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    core = (alpha > 200).astype(np.float32)
    core = cv2.erode(core, k, iterations=2)
    for _ in range(2):
        inv = 1.0 - core
        blurred = cv2.blur(rgb * core[..., None], (5, 5)) / np.maximum(cv2.blur(core, (5, 5))[..., None], 1e-3)
        rgb = rgb * (1 - inv[..., None] * 0.55) + blurred * (inv[..., None] * 0.55)

    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha])
    img = Image.fromarray(rgba, "RGBA")

    bbox = img.getbbox()
    img = img.crop(bbox)

    scale = target_h / img.height
    if scale < 1:
        img = img.resize((int(img.width * scale), target_h), Image.LANCZOS)

    out_webp = os.path.join(ASSETS, out_base + ".webp")
    img.save(out_webp, "WEBP", quality=92, method=6)
    print(f"{out_base}: {img.size} -> {os.path.basename(out_webp)} {os.path.getsize(out_webp)/1024:.0f} KB")

    # 预览：贴在深色背景上，方便人眼检查边缘
    bg = Image.new("RGB", img.size, (11, 17, 32))
    bg.paste(img, (0, 0), img)
    prev = os.path.join(ASSETS, "_preview_" + out_base + ".jpg")
    bg.save(prev, "JPEG", quality=80)


if __name__ == "__main__":
    for src, base, th in JOBS:
        cutout(os.path.join(ASSETS, src), base, th)
