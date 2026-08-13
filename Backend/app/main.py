# Backend\app\main.py

from fastapi import FastAPI
from app.api.routes.interview import router as interview_router
from app.api.routes.resume import router as resume_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-interview-coach-fazf.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)
app.include_router(resume_router)
