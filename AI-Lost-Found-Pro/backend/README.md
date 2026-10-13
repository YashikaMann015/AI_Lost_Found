# AI Lost & Found Matcher — Backend

FastAPI + MongoDB backend for a real-time lost/found workflow.

## Run
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

MongoDB must be running locally.

Admin is created automatically from `.env`:
- Email: yashika@admin.com
- Password: yashi1234

Swagger: http://127.0.0.1:8000/docs
