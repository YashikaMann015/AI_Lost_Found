from datetime import datetime
from services.text_matcher import text_similarity
from services.image_matcher import image_similarity

def location_score(a, b):
    x = set((a or "").lower().replace(",", " ").split())
    y = set((b or "").lower().replace(",", " ").split())
    return round(len(x & y) / len(x | y) * 100, 2) if x and y else 0.0

def date_score(a, b):
    try:
        diff = abs((datetime.fromisoformat(a) - datetime.fromisoformat(b)).days)
        return 100.0 if diff == 0 else 80.0 if diff == 1 else 55.0 if diff <= 3 else 20.0 if diff <= 7 else 0.0
    except Exception:
        return 0.0

def build_matches(source, candidates):
    results = []
    for c in candidates:
        if c["_id"] == source["_id"] or c["report_type"] == source["report_type"]:
            continue
        img = image_similarity(source.get("image_url"), c.get("image_url"))
        text = text_similarity(
            f'{source.get("title","")} {source.get("category","")} {source.get("description","")}',
            f'{c.get("title","")} {c.get("category","")} {c.get("description","")}'
        )
        loc = location_score(source.get("location"), c.get("location"))
        dt = date_score(source.get("date"), c.get("date"))
        # Explainable beginner-friendly weighted ranking.
        total = round(img * .40 + text * .35 + loc * .15 + dt * .10, 2)
        results.append({"candidate": c, "scores": {"image": img, "text": text, "location": loc, "date": dt}, "match_score": total})
    return sorted(results, key=lambda x: x["match_score"], reverse=True)[:10]
