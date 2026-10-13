from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database.mongodb import users_collection
from routes.auth import router as auth_router
from routes.reports import router as reports_router
from routes.matches import router as matches_router
from routes.admin import router as admin_router
from routes.uploads import router as uploads_router

BASE_DIR=Path(__file__).resolve().parent
UPLOAD_DIR=BASE_DIR/"uploads"; UPLOAD_DIR.mkdir(exist_ok=True)
app=FastAPI(title="AI Lost & Found Matcher", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173","http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads",StaticFiles(directory=str(UPLOAD_DIR)),name="uploads")
app.include_router(auth_router,prefix="/api/auth",tags=["Authentication"])
app.include_router(reports_router,prefix="/api/reports",tags=["Reports"])
app.include_router(matches_router,prefix="/api/matches",tags=["AI Matching"])
app.include_router(admin_router,prefix="/api/admin",tags=["Admin"])
app.include_router(uploads_router,prefix="/api/uploads",tags=["Uploads"])

@app.on_event("startup")
def startup():
    from services.auth_service import ensure_admin
    ensure_admin()

@app.get("/")
def root(): return {"message":"AI Lost & Found Matcher API is running"}
@app.get("/api/health")
def health(): return {"status":"ok"}
