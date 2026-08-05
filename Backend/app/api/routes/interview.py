# Backend\app\api\routes\interview.py

from fastapi import APIRouter
from app.schemas.interview import StartInterviewRequest
from app.services import llm_service

router = APIRouter()

@router.post("/interview_start")
def start_interview(interview : StartInterviewRequest):
    
    questions = llm_service.generate_interview_questions(interview.resume_id, interview.interview_type, interview.difficulty, interview.role, interview.duration)

    return{
    "message": "Interview started successfully.",
    "resume_id": interview.resume_id,
    "questions": questions
}
    