import os
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from database.mongodb import users_collection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_token(user: dict) -> str:
    payload = {
        "user_id": str(user["_id"]), "name": user["name"],
        "email": user["email"], "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, os.getenv("JWT_SECRET", "secret"), algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, os.getenv("JWT_SECRET", "secret"), algorithms=["HS256"])

def ensure_admin():
    email = os.getenv("ADMIN_EMAIL", "yashika@admin.com").lower()
    password = os.getenv("ADMIN_PASSWORD", "yashi1234")
    existing = users_collection.find_one({"email": email})
    if not existing:
        users_collection.insert_one({
            "name": "Yashika Admin", "email": email,
            "password": hash_password(password), "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
