from app.schemas import interview
import json


def generate_interview_report(
    session: interview.InterviewSession
) -> interview.InterviewReport:

    correctness_total = 0.0
    clarity_total = 0.0
    completeness_total = 0.0
    relevance_total = 0.0
    overall_total = 0.0

    evaluated_question_count = 0

    for question in session.questions:

        # ----------------------------------------------------
        # Skip questions which were not evaluated
        # ----------------------------------------------------

        if not question.evaluation:

            continue

        try:

            evaluation_dict = json.loads(
                question.evaluation
            )

        except json.JSONDecodeError as error:

            raise RuntimeError(
                "Invalid evaluation JSON found "
                f"for question: {question.question}. "
                f"Error: {error}"
            )

        # ----------------------------------------------------
        # Add scores
        # ----------------------------------------------------

        correctness_total += float(
            evaluation_dict["correctness"]
        )

        clarity_total += float(
            evaluation_dict["clarity"]
        )

        completeness_total += float(
            evaluation_dict["completeness"]
        )

        relevance_total += float(
            evaluation_dict["relevance"]
        )

        overall_total += float(
            evaluation_dict["overall_score"]
        )

        evaluated_question_count += 1

    # --------------------------------------------------------
    # No evaluations available
    # --------------------------------------------------------

    if evaluated_question_count == 0:

        raise RuntimeError(
            "Cannot generate interview report because "
            "no question evaluations are available."
        )

    # --------------------------------------------------------
    # Calculate averages
    # --------------------------------------------------------

    report = interview.InterviewReport(

        correctness=(
            correctness_total
            / evaluated_question_count
        ),

        clarity=(
            clarity_total
            / evaluated_question_count
        ),

        completeness=(
            completeness_total
            / evaluated_question_count
        ),

        relevance=(
            relevance_total
            / evaluated_question_count
        ),

        overall_score=(
            overall_total
            / evaluated_question_count
        ),
    )

    return report