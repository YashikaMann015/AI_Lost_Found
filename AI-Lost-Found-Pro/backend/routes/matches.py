from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from database.mongodb import reports_collection, matches_collection
from services.dependencies import current_user
from services.ranking import build_matches

router = APIRouter()

def clean(doc):
    d = dict(doc); d["id"] = str(d.pop("_id")); d["user_id"] = str(d["user_id"]); return d

@router.post("/generate/{report_id}")
def generate(report_id: str, user=Depends(current_user)):
    try: oid = ObjectId(report_id)
    except Exception: raise HTTPException(400, "Invalid report id")
    report = reports_collection.find_one({"_id": oid, "user_id": ObjectId(user["user_id"])})
    if not report: raise HTTPException(404, "Report not found")
    candidates = list(reports_collection.find({"report_type": {"$ne": report["report_type"]}, "user_id": {"$ne": ObjectId(user["user_id"])} }))
    results = build_matches(report, candidates)
    matches_collection.delete_many({"report_id": oid, "status": "pending_admin"})
    docs = []
    for item in results:
        docs.append({"report_id": oid, "candidate_report_id": item["candidate"]["_id"], "scores": item["scores"], "match_score": item["match_score"], "status": "pending_admin", "created_at": datetime.now(timezone.utc)})
    if docs: matches_collection.insert_many(docs)
    return {"count": len(docs), "message": "AI matching completed. Results sent to admin review.", "top_score": docs[0]["match_score"] if docs else 0}

@router.get("/my/approved")
def my_approved(user=Depends(current_user)):
    report_ids = [x["_id"] for x in reports_collection.find({"user_id": ObjectId(user["user_id"])}, {"_id":1})]
    matches = list(matches_collection.find({"$or":[{"report_id":{"$in":report_ids}},{"candidate_report_id":{"$in":report_ids}}], "status":"approved"}).sort("match_score", -1))
    output=[]
    seen=set()
    for m in matches:
        key=str(m["_id"])
        if key in seen: continue
        seen.add(key)
        other_id = m["candidate_report_id"] if m["report_id"] in report_ids else m["report_id"]
        c = reports_collection.find_one({"_id": other_id})
        if c: output.append({"id":key,"match_score":m["match_score"],"scores":m["scores"],"status":m["status"],"admin_note":m.get("admin_note",""),"report":clean(c)})
    return output
