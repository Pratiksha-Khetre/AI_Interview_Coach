# Backend\app\schemas\interview.py

from pydantic import BaseModel

class StartInterviewRequest(BaseModel):
    role : str
    interview_type : str
    difficulty : str
    duration : int