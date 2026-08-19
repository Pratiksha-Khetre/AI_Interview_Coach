from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.interview import router as interview_router
from app.api.routes.resume import router as resume_router


app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-interview-coach101-74tr.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)
app.include_router(resume_router)