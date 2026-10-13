from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone

from database.mongodb import reports_collection, matches_collection
from models.schemas import ReportCreate
from services.dependencies import current_user
from services.ranking import build_matches

router = APIRouter()


def clean(doc):
    doc = dict(doc)

    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))

    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])

    return doc


@router.post("")
def create_report(data: ReportCreate, user=Depends(current_user)):

    # 1. Create report
    doc = data.model_dump()

    doc.update({
        "user_id": ObjectId(user["user_id"]),
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc)
    })

    result = reports_collection.insert_one(doc)

    report = reports_collection.find_one({
        "_id": result.inserted_id
    })

    # 2. Find opposite-type reports
    candidates = list(
        reports_collection.find({
            "report_type": {"$ne": report["report_type"]},
            # Don't match a user's report against their own report
            "user_id": {"$ne": ObjectId(user["user_id"])}
        })
    )

    print("\n================ AI MATCHING ================")
    print("New report:", str(report["_id"]))
    print("Report type:", report["report_type"])
    print("Opposite reports found:", len(candidates))

    # 3. Generate AI matches automatically
    if candidates:

        results = build_matches(report, candidates)

        print("AI matches generated:", len(results))

        # Remove old matches for this report
        matches_collection.delete_many({
            "report_id": report["_id"]
        })

        match_docs = []

        for item in results:

            match_docs.append({
                "report_id": report["_id"],
                "candidate_report_id": item["candidate"]["_id"],
                "scores": item["scores"],
                "match_score": item["match_score"],
                "status": "pending_admin",
                "created_at": datetime.now(timezone.utc)
            })

            print(
                "Match:",
                item["match_score"],
                "%",
                item["scores"]
            )

        if match_docs:
            matches_collection.insert_many(match_docs)

            print(
                "Saved to MongoDB:",
                len(match_docs),
                "matches"
            )

    else:
        print("No opposite-type report available yet.")

    print("==============================================\n")

    return {
        "message": "Report submitted successfully",
        "report": clean(report),
        "matches_generated": len(candidates)
    }


@router.get("/mine")
def mine(user=Depends(current_user)):

    reports = reports_collection.find(
        {"user_id": ObjectId(user["user_id"])}
    ).sort("_id", -1)

    return [clean(x) for x in reports]


@router.get("/{report_id}")
def get_report(
    report_id: str,
    user=Depends(current_user)
):

    try:
        doc = reports_collection.find_one({
            "_id": ObjectId(report_id)
        })

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid report id"
        )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    if (
        str(doc["user_id"]) != user["user_id"]
        and user["role"] != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Not allowed"
        )

    return clean(doc)