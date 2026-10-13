from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from database.mongodb import users_collection
from models.schemas import RegisterRequest, LoginRequest
from services.auth_service import hash_password, verify_password, create_token

router = APIRouter()

def public_user(u):
    return {"id": str(u["_id"]), "name": u["name"], "email": u["email"], "role": u["role"]}

@router.post("/register")
def register(data: RegisterRequest):
    email = str(data.email).lower().strip()
    if users_collection.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    doc = {"name": data.name.strip(), "email": email, "password": hash_password(data.password), "role": "user", "created_at": datetime.now(timezone.utc)}
    result = users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"message": "Account created", "user": public_user(doc)}

@router.post("/login")
def login(data: LoginRequest):
    user = users_collection.find_one({"email": str(data.email).lower().strip()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    return {"token": create_token(user), "user": public_user(user)}
