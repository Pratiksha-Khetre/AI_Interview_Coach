# Backend\app\api\routes\resume.py
from app.services import resume_service
from fastapi import File, UploadFile

from fastapi import APIRouter

router = APIRouter()

@router.post("/resume/upload")
def upload_resume(file : UploadFile = File(...)):
    return resume_service.upload_resume(file)