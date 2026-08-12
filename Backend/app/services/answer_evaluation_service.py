# Backend/app/services/answer_evaluation_service.py

"""
Service responsible for evaluating interview answers.

LLM provider selection is handled centrally by:

    app.services.llm_service

Provider fallback:

    Gemini
       ↓
    Groq
       ↓
    OpenRouter
"""

import json

from langchain_core.documents import Document

from app.services import (
    retrieval_service,
    llm_service,
)


# ============================================================
# CONFIGURATION
# ============================================================

TOP_K = 3


# ============================================================
# BUILD RETRIEVAL QUERY
# ============================================================

def build_retrieval_query(
    role: str,
    interview_type: str,
    question: str,
) -> str:

    return (
        f"{role} "
        f"{interview_type} "
        f"interview "
        f"question "
        f"{question}"
    )


# ============================================================
# BUILD EVALUATION PROMPT
# ============================================================

def build_answer_evaluation_prompt(
    context: list[Document],
    question: str,
    answer: str,
) -> str:

    context_text = "\n\n".join(
        doc.page_content
        for doc in context
    )

    prompt = f"""
You are an experienced technical interviewer.

Your task is to evaluate a candidate's interview answer.

=========================
RESUME CONTEXT
=========================

{context_text}

=========================
INTERVIEW QUESTION
=========================

{question}

=========================
CANDIDATE ANSWER
=========================

{answer}

=========================
EVALUATION INSTRUCTIONS
=========================

Evaluate the answer carefully.

1. Evaluate the candidate's answer based on:
   - the interview question
   - the provided resume context

2. Do not assume information that is not present.

3. Reward technically correct information.

4. Penalize incorrect information.

5. Penalize fabricated experience.

6. If the candidate misses important points,
   mention them.

7. Keep feedback constructive and professional.

8. Score every numerical criterion from 0 to 10.

Criteria:

- correctness
- clarity
- completeness
- relevance
- overall_score

Also provide:

- strengths
- areas_for_improvement
- final_feedback

The final feedback should be concise.

=========================
IMPORTANT
=========================

Return ONLY valid JSON.

Do not use markdown.

Do not use ```json.

Do not include any explanation outside the JSON.

Use exactly this structure:

{{
    "correctness": 0,
    "clarity": 0,
    "completeness": 0,
    "relevance": 0,
    "overall_score": 0,
    "strengths": [
        ""
    ],
    "areas_for_improvement": [
        ""
    ],
    "final_feedback": ""
}}
"""

    return prompt


# ============================================================
# CLEAN JSON RESPONSE
# ============================================================

def clean_json_response(
    text: str,
) -> str:

    text = text.strip()

    # Remove ```json
    if text.startswith("```json"):

        text = text[
            len("```json"):
        ].strip()

    # Remove ```
    if text.startswith("```"):

        text = text[
            len("```"):
        ].strip()

    if text.endswith("```"):

        text = text[
            :-len("```")
        ].strip()

    return text


# ============================================================
# VALIDATE EVALUATION
# ============================================================

def validate_evaluation(
    evaluation_text: str,
) -> str:

    cleaned_text = clean_json_response(
        evaluation_text
    )

    try:

        data = json.loads(
            cleaned_text
        )

    except json.JSONDecodeError as error:

        raise RuntimeError(
            "LLM returned invalid JSON "
            f"for answer evaluation: {error}"
        )

    required_fields = [
        "correctness",
        "clarity",
        "completeness",
        "relevance",
        "overall_score",
        "strengths",
        "areas_for_improvement",
        "final_feedback",
    ]

    for field in required_fields:

        if field not in data:

            raise RuntimeError(
                f"Evaluation JSON is missing "
                f"required field: {field}"
            )

    # Ensure score fields are numbers.
    score_fields = [
        "correctness",
        "clarity",
        "completeness",
        "relevance",
        "overall_score",
    ]

    for field in score_fields:

        try:

            value = float(
                data[field]
            )

        except (
            TypeError,
            ValueError,
        ):

            raise RuntimeError(
                f"Evaluation field '{field}' "
                "must be a number."
            )

        # Keep scores inside 0-10.
        data[field] = max(
            0.0,
            min(10.0, value)
        )

    # Make sure these are arrays.
    if not isinstance(
        data["strengths"],
        list,
    ):

        data["strengths"] = [
            str(data["strengths"])
        ]

    if not isinstance(
        data["areas_for_improvement"],
        list,
    ):

        data["areas_for_improvement"] = [
            str(
                data[
                    "areas_for_improvement"
                ]
            )
        ]

    if not isinstance(
        data["final_feedback"],
        str,
    ):

        data["final_feedback"] = str(
            data["final_feedback"]
        )

    return json.dumps(
        data,
        ensure_ascii=False,
    )


# ============================================================
# GENERATE ANSWER EVALUATION
# ============================================================

def generate_answer_evaluation(
    role: str,
    interview_type: str,
    question: str,
    answer: str,
    resume_id: str,
) -> str:

    if not answer or not answer.strip():

        # We still evaluate an empty answer rather than
        # sending unnecessary LLM context.
        answer = "No answer submitted."

    # --------------------------------------------------------
    # RETRIEVE RESUME CONTEXT
    # --------------------------------------------------------

    query = build_retrieval_query(
        role=role,
        interview_type=interview_type,
        question=question,
    )

    retrieved_context = (
        retrieval_service.retrieve_context(
            resume_id,
            query,
            k=TOP_K,
        )
    )

    # --------------------------------------------------------
    # BUILD PROMPT
    # --------------------------------------------------------

    prompt = build_answer_evaluation_prompt(
        context=retrieved_context,
        question=question,
        answer=answer,
    )

    # --------------------------------------------------------
    # LLM
    #
    # Gemini -> Groq -> OpenRouter
    # --------------------------------------------------------

    evaluation = llm_service.generate_text(
        prompt
    )

    # --------------------------------------------------------
    # VALIDATE JSON
    # --------------------------------------------------------

    validated_evaluation = (
        validate_evaluation(
            evaluation
        )
    )

    return validated_evaluation