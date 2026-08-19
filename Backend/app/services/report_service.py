# Backend/app/services/report_service.py

from collections import Counter
import json

from app.schemas import interview


# ============================================================
# BUILD COMMUNICATION ANALYSIS
# ============================================================
#
# Aggregates the per-answer metrics (answer_duration, word_count,
# wpm, filler_words) that submit_answer() already stored on each
# InterviewQuestion. Kept fully separate from the AI answer-quality
# scoring below — this never touches correctness/clarity/etc.

def build_communication_analysis(
    session: interview.InterviewSession,
) -> interview.CommunicationAnalysis | None:

    duration_total = 0
    wpm_total = 0.0
    filler_total = 0
    filler_counter: "Counter[str]" = Counter()
    analyzed_count = 0

    for question in session.questions:

        # Only questions submitted through the normal flow (with
        # timing) have answer_duration set. Anything else — e.g. a
        # session created before this feature existed — is skipped
        # rather than treated as a zero-duration answer.
        if question.answer_duration is None:
            continue

        analyzed_count += 1
        duration_total += question.answer_duration

        if question.wpm:
            wpm_total += question.wpm

        if question.filler_word_count:
            filler_total += question.filler_word_count

        if question.filler_words:
            filler_counter.update(question.filler_words)

    if analyzed_count == 0:
        return None

    most_common_filler_word = None

    if filler_counter:
        most_common_filler_word = filler_counter.most_common(1)[0][0]

    return interview.CommunicationAnalysis(
        average_answer_duration=round(
            duration_total / analyzed_count, 1
        ),
        average_wpm=round(
            wpm_total / analyzed_count, 1
        ),
        total_filler_words=filler_total,
        most_common_filler_word=most_common_filler_word,
        answers_analyzed=analyzed_count,
    )


# ============================================================
# GENERATE INTERVIEW REPORT
# ============================================================

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

        communication_analysis=build_communication_analysis(
            session
        ),
    )

    return report