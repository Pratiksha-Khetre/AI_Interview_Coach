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

    # ------------------------------------------------------------
    # Communication metrics (answer timing + speech metrics).
    #
    # All optional with default None so any existing code that
    # constructs InterviewQuestion(question=..., answer=None,
    # evaluation=None) — like interview_session_service already
    # does — keeps working unchanged.
    # ------------------------------------------------------------

    answer_duration: int | None = None
    word_count: int | None = None
    wpm: float | None = None
    filler_word_count: int | None = None
    filler_words: dict[str, int] | None = None


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


class CommunicationAnalysis(BaseModel):
    average_answer_duration: float
    average_wpm: float
    total_filler_words: int
    most_common_filler_word: str | None
    answers_analyzed: int


class InterviewReport(BaseModel):

    correctness : float
    clarity : float
    completeness : float
    relevance : float
    overall_score : float

    # Optional, default None, so any existing code that builds
    # InterviewReport(correctness=..., clarity=..., ...) without
    # this argument keeps working unchanged.
    communication_analysis: CommunicationAnalysis | None = None


class InterviewAnswer(BaseModel):
    interview_id : str
    answer : str

    # Optional with a safe default of 0 seconds, so any existing
    # client that posts {interview_id, answer} without this field
    # still works exactly as before.
    answer_duration: int = 0