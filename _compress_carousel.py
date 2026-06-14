"""
把 4MB PNG 用户图压缩到 1920x1080 JPEG @ 0.9 → 输出 base64 字符串
然后把这个字符串替换到 _jsonbin_payload.json 的 carouselImages[0]
最后用 _push_to_jsonbin.js 推上去
"""
import base64
import json
import io
from PIL import Image

SRC = r'C:\Users\Administrator\Pictures\59923b51df298200c3fefb02bcb26200.png'
PAYLOAD = r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30\_jsonbin_payload.json'
OUT_PAYLOAD = r'C:\Users\Administrator\WorkBuddy\2026-06-12-18-25-30\_jsonbin_payload_v2.json'

print('==== 压缩用户轮播图 ====')
img = Image.open(SRC)
print(f'原图: {img.size[0]}x{img.size[1]}, mode={img.mode}')

# 缩到 1920x1080 (保持宽高比, 居中裁切)
target_w, target_h = 1920, 1080
src_w, src_h = img.size
src_ratio = src_w / src_h
target_ratio = target_w / target_h

if src_ratio > target_ratio:
    # 源更宽 → 按高度缩放后裁切宽度
    new_h = target_h
    new_w = int(src_w * target_h / src_h)
else:
    # 源更高 → 按宽度缩放后裁切高度
    new_w = target_w
    new_h = int(src_h * target_w / src_w)

img_resized = img.resize((new_w, new_h), Image.LANCZOS)

# 居中裁切
left = (new_w - target_w) // 2
top = (new_h - target_h) // 2
img_cropped = img_resized.crop((left, top, left + target_w, top + target_h))

# 转 RGB (PNG 可能是 RGBA)
if img_cropped.mode != 'RGB':
    img_cropped = img_cropped.convert('RGB')

# 保存为 JPEG @ 0.9
buf = io.BytesIO()
img_cropped.save(buf, format='JPEG', quality=40, optimize=True)
jpeg_bytes = buf.getvalue()
print(f'压缩后大小: {len(jpeg_bytes) / 1024:.2f} KB')

# 转 base64
b64 = base64.b64encode(jpeg_bytes).decode('ascii')
data_uri = f'data:image/jpeg;base64,{b64}'
print(f'Base64 长度: {len(b64) / 1024:.2f} KB')

# 读现有 payload
with open(PAYLOAD, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 替换 carouselImages[0]
if 'carouselImages' not in data:
    data['carouselImages'] = []
if not data['carouselImages']:
    data['carouselImages'].append({'id': 1781279072020381, 'title': '黑塔办事处合影', 'url': data_uri})
else:
    data['carouselImages'][0] = {'id': data['carouselImages'][0].get('id', 1781279072020381), 'title': '黑塔办事处合影', 'url': data_uri}

# 顺便加 2 张额外轮播图 (用同一张图的不同裁切或者再压一次)
if len(data['carouselImages']) < 3:
    # 用原图的不同区域裁切
    img2 = Image.open(SRC)
    img2.thumbnail((1920, 1080), Image.LANCZOS)
    if img2.mode != 'RGB':
        img2 = img2.convert('RGB')
    buf2 = io.BytesIO()
    img2.save(buf2, format='JPEG', quality=65, optimize=True)
    jpeg_bytes2 = buf2.getvalue()
    b64_2 = base64.b64encode(jpeg_bytes2).decode('ascii')
    data_uri2 = f'data:image/jpeg;base64,{b64_2}'
    data['carouselImages'].append({'id': 1781279072020382, 'title': '团队合影 (2)', 'url': data_uri2})

# 输出新 payload
total_size = len(json.dumps(data, ensure_ascii=False).encode('utf-8'))
print(f'最终 payload 大小: {total_size / 1024:.2f} KB')

with open(OUT_PAYLOAD, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)

print(f'✅ 已写入: {OUT_PAYLOAD}')
