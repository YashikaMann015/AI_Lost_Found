import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client[os.getenv("MONGO_DB", "lost_found_pro")]
users_collection = db["users"]
reports_collection = db["reports"]
matches_collection = db["matches"]

users_collection.create_index("email", unique=True)
reports_collection.create_index("user_id")
reports_collection.create_index("report_type")
matches_collection.create_index("status")
matches_collection.create_index([("match_score", -1)])
