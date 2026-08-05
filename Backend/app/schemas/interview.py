# Backend\app\schemas\interview.py

from pydantic import BaseModel

class StartInterviewRequest(BaseModel):
    resume_id : str
    role : str
    interview_type : str
    difficulty : str
    duration : int