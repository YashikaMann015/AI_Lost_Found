from pathlib import Path
from PIL import Image, ImageOps
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]

def get_path(url):
    if not url or not url.startswith("/uploads/"):
        return None
    p = BASE_DIR / "uploads" / url.split("/uploads/", 1)[1]
    return p if p.exists() else None

def features(path):
    img = Image.open(path).convert("RGB")
    img = ImageOps.fit(img, (64, 64))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    result = []
    for c in range(3):
        h, _ = np.histogram(arr[:, :, c], bins=16, range=(0, 1))
        h = h / (np.linalg.norm(h) + 1e-8)
        result.extend(h)
    gray = arr.mean(axis=2)
    small = Image.fromarray((gray * 255).astype(np.uint8)).resize((16, 16))
    s = np.asarray(small, dtype=np.float32).flatten() / 255.0
    s = s / (np.linalg.norm(s) + 1e-8)
    return np.concatenate([np.array(result), s])

def image_similarity(a, b):
    p1, p2 = get_path(a), get_path(b)
    if not p1 or not p2:
        return 0.0
    try:
        f1, f2 = features(p1), features(p2)
        score = np.dot(f1, f2) / (np.linalg.norm(f1) * np.linalg.norm(f2) + 1e-8)
        return round(max(0, min(1, float(score))) * 100, 2)
    except Exception:
        return 0.0
