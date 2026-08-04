# Backend\app\api\routes\interview.py

from fastapi import APIRouter
from app.schemas.interview import StartInterviewRequest

router = APIRouter()

@router.post("/interview_start")
def start_interview(interview : StartInterviewRequest):
    return{
        'message' : "Interview is started",
        'data': interview.model_dump()
    }