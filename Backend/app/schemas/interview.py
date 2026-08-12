# Backend\app\schemas\interview.py

from pydantic import BaseModel

class StartInterviewRequest(BaseModel):
    resume_id : str
    role : str
    interview_type : str
    difficulty : str
    duration : int

class InterviewQuestion(BaseModel):
    question : str
    answer : str | None
    evaluation : str | None

class InterviewSession(BaseModel):
    interview_id: str
    resume_id: str
    role: str
    interview_type: str
    difficulty: str
    duration: int

    questions: list[InterviewQuestion]

    current_question_index: int
    status: str

class InterviewReport(BaseModel):

    correctness : float
    clarity : float
    completeness : float
    relevance : float
    overall_score : float

class InterviewAnswer(BaseModel):
    interview_id : str
    answer : str
    