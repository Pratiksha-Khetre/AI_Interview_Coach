# Backend/app/services/interview_session_service.py

import uuid

from app.schemas import interview
from app.services import (
    answer_evaluation_service,
    report_service,
)


# ============================================================
# IN-MEMORY INTERVIEW STORE
# ============================================================

INTERVIEW_STORE: dict[
    str,
    interview.InterviewSession
] = {}


# ============================================================
# CREATE INTERVIEW SESSION
# ============================================================

def create_interview_session(
    resume_id: str,
    role: str,
    difficulty: str,
    duration: int,
    interview_type: str,
    questions: list[str],
) -> interview.InterviewSession:

    interview_id = str(uuid.uuid4())

    interview_questions = []

    for question in questions:

        interview_questions.append(
            interview.InterviewQuestion(
                question=question,
                answer=None,
                evaluation=None,
            )
        )

    session = interview.InterviewSession(
        interview_id=interview_id,
        resume_id=resume_id,
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        duration=duration,
        questions=interview_questions,
        current_question_index=0,
        status="STARTED",
    )

    return session


# ============================================================
# SAVE SESSION
# ============================================================

def save_session(
    session: interview.InterviewSession,
) -> None:

    INTERVIEW_STORE[
        session.interview_id
    ] = session


# ============================================================
# GET SESSION
# ============================================================

def get_session(
    interview_id: str,
) -> interview.InterviewSession:

    if interview_id not in INTERVIEW_STORE:

        raise KeyError(
            f"Interview session not found: {interview_id}"
        )

    return INTERVIEW_STORE[
        interview_id
    ]


# ============================================================
# GET ONE INTERVIEW
#
# Used by:
# GET /interview/{interview_id}
# ============================================================

def get_interview(
    interview_id: str,
) -> interview.InterviewSession:

    return get_session(
        interview_id
    )


# ============================================================
# GET ALL COMPLETED INTERVIEWS
#
# Used by:
# GET /history
# ============================================================

def get_interview_history() -> list[
    interview.InterviewSession
]:

    history = []

    for session in INTERVIEW_STORE.values():

        if session.status == "COMPLETED":

            history.append(session)

    return history


# ============================================================
# SUBMIT ANSWER
# ============================================================

def submit_answer(
    interview_id: str,
    answer: str,
):

    session = get_session(
        interview_id
    )

    current_question_index = (
        session.current_question_index
    )

    current_question = (
        session.questions[
            current_question_index
        ]
    )

    # --------------------------------------------------------
    # Save candidate answer only.
    #
    # IMPORTANT:
    # We DO NOT evaluate here.
    # Evaluation happens after all questions are answered.
    # --------------------------------------------------------

    current_question.answer = answer

    save_session(
        session
    )

    return current_question


# ============================================================
# NEXT QUESTION
# ============================================================

def next_question(
    interview_id: str,
):

    session = get_session(
        interview_id
    )

    # --------------------------------------------------------
    # Check if this is already the last question
    # --------------------------------------------------------

    if (
        session.current_question_index
        >= len(session.questions) - 1
    ):

        return None

    # --------------------------------------------------------
    # Move to next question
    # --------------------------------------------------------

    session.current_question_index += 1

    # --------------------------------------------------------
    # Save session
    # --------------------------------------------------------

    save_session(
        session
    )

    # --------------------------------------------------------
    # Return next question
    # --------------------------------------------------------

    return session.questions[
        session.current_question_index
    ]


# ============================================================
# EVALUATE ALL ANSWERS
# ============================================================

def evaluate_all_answers(
    session: interview.InterviewSession
) -> None:

    for question in session.questions:

        if not question.answer:
            question.answer = "No answer submitted."

        evaluation = (
            answer_evaluation_service
            .generate_answer_evaluation(
                role=session.role,
                interview_type=session.interview_type,
                question=question.question,
                answer=question.answer,
                resume_id=session.resume_id,
            )
        )

        question.evaluation = evaluation

# ============================================================
# COMPLETE INTERVIEW
# ============================================================

def complete_session(
    interview_id: str,
):

    session = get_session(
        interview_id
    )

    # --------------------------------------------------------
    # Evaluate all answers
    # --------------------------------------------------------

    evaluate_all_answers(
        session
    )

    # --------------------------------------------------------
    # Mark interview as completed
    # --------------------------------------------------------

    session.status = "COMPLETED"

    # --------------------------------------------------------
    # Generate final interview report
    # --------------------------------------------------------

    report = (
        report_service
        .generate_interview_report(
            session
        )
    )

    # --------------------------------------------------------
    # Save completed session
    # --------------------------------------------------------

    save_session(
        session
    )

    return report