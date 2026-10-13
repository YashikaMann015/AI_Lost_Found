# FindBack — AI Lost & Found Matcher

A portfolio-ready, full-stack Lost & Found platform built for real users. No demo reports are pre-seeded.

## Stack
- Frontend: React + Vite + responsive custom CSS
- Backend: FastAPI
- Database: MongoDB
- Auth: JWT + bcrypt
- Image upload: FastAPI multipart uploads
- AI/ML: TF-IDF + cosine similarity for text; image histogram/structure similarity with Pillow + NumPy
- Ranking: 40% image + 35% text + 15% location + 10% date

## Core workflow
1. User registers and logs in.
2. User submits a real Lost/Found report with image and context.
3. Backend stores it in MongoDB.
4. AI compares it with opposite-type reports from other users.
5. Top candidates go to the Admin review queue.
6. Admin approves or rejects each candidate.
7. Only approved matches are shown to relevant users.

## Admin
Exactly one admin account is auto-created from `.env`:
- Email: `yashika@admin.com`
- Password: `yashi1234`

## Run backend
```powershell
cd "C:\Users\USER\Downloads\AI-Lost-Found-Pro\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
If you already have the venv from the earlier project, run only:
```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Run frontend
Open a second PowerShell:
```powershell
cd "C:\Users\USER\Downloads\AI-Lost-Found-Pro\frontend"
npm install
npm run dev
```
Open `http://localhost:5173`.

## MongoDB
Make sure your local MongoDB service is running. The app uses `mongodb://localhost:27017` by default.

## API docs
`http://127.0.0.1:8000/docs`

## Notes
This is an explainable beginner-to-intermediate AI matcher, not a semantic vision model. The image component compares actual uploaded image content. For a future advanced version, replace it with CLIP/ResNet embeddings without changing the user/admin workflow.
