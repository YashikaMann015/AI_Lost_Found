from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database.mongodb import reports_collection, matches_collection, users_collection
from models.schemas import DecisionRequest
from services.dependencies import admin_user

router = APIRouter()

def clean_report(x):
    d=dict(x); d["id"]=str(d.pop("_id")); d["user_id"]=str(d["user_id"]); return d

@router.get("/dashboard")
def dashboard(admin=Depends(admin_user)):
    return {
        "users": users_collection.count_documents({"role":"user"}),
        "reports": reports_collection.count_documents({}),
        "lost": reports_collection.count_documents({"report_type":"lost"}),
        "found": reports_collection.count_documents({"report_type":"found"}),
        "pending_matches": matches_collection.count_documents({"status":"pending_admin"}),
        "approved_matches": matches_collection.count_documents({"status":"approved"}),
        "rejected_matches": matches_collection.count_documents({"status":"rejected"})
    }

@router.get("/matches/pending")
def pending(admin=Depends(admin_user)):
    matches=list(matches_collection.find({"status":"pending_admin"}).sort("match_score",-1))
    output=[]
    for m in matches:
        source=reports_collection.find_one({"_id":m["report_id"]}); candidate=reports_collection.find_one({"_id":m["candidate_report_id"]})
        if source and candidate:
            output.append({"id":str(m["_id"]),"match_score":m["match_score"],"scores":m["scores"],"source":clean_report(source),"candidate":clean_report(candidate)})
    return output

@router.post("/matches/{match_id}/decision")
def decision(match_id: str, data: DecisionRequest, admin=Depends(admin_user)):
    try: oid=ObjectId(match_id)
    except Exception: raise HTTPException(400,"Invalid match id")
    result=matches_collection.update_one({"_id":oid},{"$set":{"status":data.decision,"admin_note":data.admin_note}})
    if not result.matched_count: raise HTTPException(404,"Match not found")
    return {"message":f"Match {data.decision}"}

@router.get("/reports")
def reports(admin=Depends(admin_user)):
    return [clean_report(x) for x in reports_collection.find({}).sort("created_at",-1)]
