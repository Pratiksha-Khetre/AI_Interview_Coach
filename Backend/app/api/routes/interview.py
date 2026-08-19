# Backend\app\api\routes\interview.py

from fastapi import APIRouter, HTTPException
from app.schemas.interview import StartInterviewRequest, InterviewAnswer
from app.services import llm_service, interview_session_service

router = APIRouter()


@router.post("/interview_start")
def start_interview(interview: StartInterviewRequest):

    questions = llm_service.generate_interview_questions(
        interview.resume_id,
        interview.interview_type,
        interview.difficulty,
        interview.role,
        interview.duration
    )

    session = interview_session_service.create_interview_session(
        interview.resume_id,
        interview.role,
        interview.difficulty,
        interview.duration,
        interview.interview_type,
        questions
    )

    interview_session_service.save_session(session)

    return {
        "message": "Your Interview is Started",
        "interview_id": session.interview_id,
        "question": session.questions[0],
        "total_questions": len(session.questions)
    }


@router.post("/submit_answer")
def submit_answer(interview: InterviewAnswer):

    session = interview_session_service.get_session(
        interview.interview_id
    )

    current_question_index = session.current_question_index
    total_question = len(session.questions) - 1

    # --------------------------------------------------------
    # Save answer only.
    # No evaluation during the interview.
    #
    # answer_duration (seconds) comes from the frontend's
    # per-question timer. It defaults to 0 on the schema, so
    # this stays backward compatible with any client that
    # doesn't send it.
    # --------------------------------------------------------

    interview_session_service.submit_answer(
        interview.interview_id,
        interview.answer,
        interview.answer_duration
    )

    # --------------------------------------------------------
    # If more questions remain
    # --------------------------------------------------------

    if current_question_index < total_question:

        next_question = interview_session_service.next_question(
            interview.interview_id
        )

        return {
            "completed": False,
            "question": next_question
        }

    # --------------------------------------------------------
    # Last question → complete interview
    # --------------------------------------------------------

    else:

        report = interview_session_service.complete_session(
            interview.interview_id
        )

        return {
            "completed": True,
            "message": "Interview completed successfully.",
            "report": report
        }

@router.get("/interview/{interview_id}")
def get_interview(interview_id: str):

    try:

        session = interview_session_service.get_interview(
            interview_id
        )

        return session

    except KeyError:

        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

@router.get("/history")
def get_history():

    return {
        "history": interview_session_service.get_interview_history()
    }