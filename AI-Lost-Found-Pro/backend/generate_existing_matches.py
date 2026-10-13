from datetime import datetime, timezone

from database.mongodb import reports_collection, matches_collection
from services.ranking import build_matches


print("\n========================================")
print(" AI LOST & FOUND - EXISTING MATCHES")
print("========================================\n")


# Get all existing reports
reports = list(reports_collection.find({}))

print("Total reports found:", len(reports))

if not reports:
    print("No reports found.")
    exit()


lost_reports = [
    r for r in reports
    if r.get("report_type") == "lost"
]

found_reports = [
    r for r in reports
    if r.get("report_type") == "found"
]

print("Lost reports :", len(lost_reports))
print("Found reports:", len(found_reports))


if not lost_reports or not found_reports:
    print("\nNeed at least one LOST and one FOUND report.")
    exit()


total_created = 0


# Compare every LOST report with every FOUND report
for lost in lost_reports:

    print("\n----------------------------------------")
    print("Lost:", lost.get("title"))
    print("ID  :", lost["_id"])

    results = build_matches(
        lost,
        found_reports
    )

    for item in results:

        found = item["candidate"]

        # Check whether this exact pair already exists
        existing = matches_collection.find_one({
            "report_id": lost["_id"],
            "candidate_report_id": found["_id"]
        })

        if existing:
            print(
                "Already exists:",
                lost.get("title"),
                "<->",
                found.get("title")
            )
            continue

        match_doc = {
            "report_id": lost["_id"],
            "candidate_report_id": found["_id"],
            "scores": item["scores"],
            "match_score": item["match_score"],
            "status": "pending_admin",
            "created_at": datetime.now(timezone.utc)
        }

        matches_collection.insert_one(match_doc)

        total_created += 1

        print("\nMATCH CREATED")
        print("Lost   :", lost.get("title"))
        print("Found  :", found.get("title"))
        print("Score  :", item["match_score"], "%")
        print("Scores :", item["scores"])


print("\n========================================")
print("MATCHING COMPLETE")
print("New matches created:", total_created)
print(
    "Total matches in database:",
    matches_collection.count_documents({})
)
print("========================================\n")