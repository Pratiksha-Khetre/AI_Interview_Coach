# Backend\app\services\llm_service.py

"""
Central LLM service.

Provider fallback:

    Gemini
       ↓
    Groq
       ↓
    OpenRouter

This service is responsible for:
    1. LLM provider management
    2. Provider fallback
    3. Resume-context retrieval
    4. Question-generation prompt construction
    5. Interview question parsing

Other services should call:

    llm_service.generate_text(prompt)

instead of calling Gemini/Groq/OpenRouter directly.
"""

import os
import re

from dotenv import load_dotenv
from langchain_core.documents import Document

from google import genai
from groq import Groq
from openai import OpenAI

from app.services import retrieval_service


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


# ============================================================
# MODEL CONFIGURATION
# ============================================================

# Gemini
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash",
)

# Groq
#
# Change this if the model is unavailable for your account.
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile",
)

# OpenRouter
#
# OpenRouter uses OpenAI-compatible API.
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "meta-llama/llama-3.3-70b-instruct:free",
)


# ============================================================
# CLIENT INITIALIZATION
# ============================================================

gemini_client = None
groq_client = None
openrouter_client = None


if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )


if GROQ_API_KEY:
    groq_client = Groq(
        api_key=GROQ_API_KEY
    )


if OPENROUTER_API_KEY:
    openrouter_client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )


# ============================================================
# PROVIDER STATUS
# ============================================================

def get_provider_status() -> dict:
    """
    Returns which LLM providers have API keys configured.
    """

    return {
        "gemini": gemini_client is not None,
        "groq": groq_client is not None,
        "openrouter": openrouter_client is not None,
    }


# ============================================================
# GEMINI
# ============================================================

def generate_with_gemini(
    prompt: str,
) -> str:

    if gemini_client is None:

        raise RuntimeError(
            "Gemini API key is not configured."
        )

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    if not response.text:

        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return response.text.strip()


# ============================================================
# GROQ
# ============================================================

def generate_with_groq(
    prompt: str,
) -> str:

    if groq_client is None:

        raise RuntimeError(
            "Groq API key is not configured."
        )

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.3,
    )

    if not response.choices:

        raise RuntimeError(
            "Groq returned an empty response."
        )

    content = response.choices[0].message.content

    if not content:

        raise RuntimeError(
            "Groq returned an empty response."
        )

    return content.strip()


# ============================================================
# OPENROUTER
# ============================================================

def generate_with_openrouter(
    prompt: str,
) -> str:

    if openrouter_client is None:

        raise RuntimeError(
            "OpenRouter API key is not configured."
        )

    response = openrouter_client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.3,
    )

    if not response.choices:

        raise RuntimeError(
            "OpenRouter returned an empty response."
        )

    content = response.choices[0].message.content

    if not content:

        raise RuntimeError(
            "OpenRouter returned an empty response."
        )

    return content.strip()


# ============================================================
# CENTRAL FALLBACK FUNCTION
# ============================================================

def generate_text(
    prompt: str,
) -> str:

    """
    Generate text using the configured LLM providers.

    Provider order:

        Gemini
        ↓
        Groq
        ↓
        OpenRouter

    If one provider fails, the next provider is tried.

    This function should be used by all application
    services instead of directly calling an LLM provider.
    """

    if not prompt or not prompt.strip():

        raise ValueError(
            "Prompt cannot be empty."
        )

    errors = []


    # ========================================================
    # GEMINI
    # ========================================================

    if gemini_client is not None:

        try:

            print(
                "[LLM] Trying Gemini..."
            )

            response = generate_with_gemini(
                prompt
            )

            print(
                "[LLM] Gemini succeeded."
            )

            return response

        except Exception as error:

            print(
                f"[LLM] Gemini failed: {error}"
            )

            errors.append(
                f"Gemini: {error}"
            )


    # ========================================================
    # GROQ
    # ========================================================

    if groq_client is not None:

        try:

            print(
                "[LLM] Trying Groq..."
            )

            response = generate_with_groq(
                prompt
            )

            print(
                "[LLM] Groq succeeded."
            )

            return response

        except Exception as error:

            print(
                f"[LLM] Groq failed: {error}"
            )

            errors.append(
                f"Groq: {error}"
            )


    # ========================================================
    # OPENROUTER
    # ========================================================

    if openrouter_client is not None:

        try:

            print(
                "[LLM] Trying OpenRouter..."
            )

            response = generate_with_openrouter(
                prompt
            )

            print(
                "[LLM] OpenRouter succeeded."
            )

            return response

        except Exception as error:

            print(
                f"[LLM] OpenRouter failed: {error}"
            )

            errors.append(
                f"OpenRouter: {error}"
            )


    # ========================================================
    # EVERYTHING FAILED
    # ========================================================

    error_message = "\n".join(
        errors
    )

    raise RuntimeError(
        "All configured LLM providers failed.\n\n"
        + error_message
    )


# ============================================================
# QUESTION COUNT
# ============================================================

def get_question_count(
    duration: int,
) -> int:

    if duration == 20:

        return 4

    elif duration == 30:

        return 12

    elif duration == 45:

        return 18

    else:

        # 60 minutes
        return 25


# ============================================================
# BUILD QUESTION GENERATION PROMPT
# ============================================================

def build_question_generation_prompt(
    context: list[Document],
    role: str,
    difficulty: str,
    interview_type: str,
    duration: int,
    number_of_questions: int,
) -> str:

    context_text = "\n\n".join(
        doc.page_content
        for doc in context
    )


    prompt = f"""
You are an experienced technical interviewer.

Your task is to conduct a realistic interview
for the candidate.

=========================
INTERVIEW DETAILS
=========================

Role:
{role}

Interview Type:
{interview_type}

Difficulty:
{difficulty}

Total Interview Duration:
{duration} minutes

Number of Questions:
{number_of_questions}


=========================
CANDIDATE RESUME CONTEXT
=========================

{context_text}


=========================
INSTRUCTIONS
=========================

1. Generate interview questions strictly using
   the provided resume context.

2. Ask questions relevant to the candidate's:

   - projects
   - internships
   - technical skills
   - certifications
   - achievements
   - work experience

3. Do not invent experience or information
   that is not present in the resume.

4. Do not ask generic interview questions unless
   they are directly related to the candidate's
   resume.

5. Ask questions naturally, like a real interviewer.

6. Questions should gradually increase in difficulty.

7. Generate exactly {number_of_questions} questions.

8. Focus primarily on projects, internships,
   technical skills, certifications, achievements,
   and experience before theoretical questions.

9. If the resume does not contain enough information,
   ask role-specific questions instead of inventing
   resume details.

10. Return ONLY the numbered interview questions.

11. Do not include:

    - greetings
    - introduction
    - explanations
    - answers
    - hints
    - markdown
    - additional text

12. Use this format:

1. Question one?
2. Question two?
3. Question three?

Generate exactly {number_of_questions} questions.
"""


    return prompt.strip()


# ============================================================
# BUILD RETRIEVAL QUERY
# ============================================================

def build_retrieval_query(
    role: str,
    interview_type: str,
) -> str:

    return (
        f"{role}, "
        f"{interview_type} interview"
    )


# ============================================================
# GENERATE INTERVIEW QUESTIONS
# ============================================================

def generate_interview_questions(
    resume_id: str,
    interview_type: str,
    difficulty: str,
    role: str,
    duration: int,
) -> list[str]:

    # --------------------------------------------------------
    # RETRIEVE RESUME CONTEXT
    # --------------------------------------------------------

    query = build_retrieval_query(
        role,
        interview_type,
    )

    retrieved_context = (
        retrieval_service.retrieve_context(
            resume_id,
            query,
        )
    )


    # --------------------------------------------------------
    # QUESTION COUNT
    # --------------------------------------------------------

    count = get_question_count(
        duration
    )


    # --------------------------------------------------------
    # BUILD PROMPT
    # --------------------------------------------------------

    prompt = (
        build_question_generation_prompt(
            context=retrieved_context,
            role=role,
            difficulty=difficulty,
            interview_type=interview_type,
            duration=duration,
            number_of_questions=count,
        )
    )


    # --------------------------------------------------------
    # LLM
    #
    # Gemini → Groq → OpenRouter
    # --------------------------------------------------------

    questions_response = generate_text(
        prompt
    )


    # --------------------------------------------------------
    # PARSE QUESTIONS
    # --------------------------------------------------------

    parsed_questions = parse_questions(
        questions_response
    )


    # --------------------------------------------------------
    # VALIDATE QUESTION COUNT
    # --------------------------------------------------------

    if len(parsed_questions) < count:

        raise RuntimeError(
            f"LLM generated only "
            f"{len(parsed_questions)} questions, "
            f"but {count} were expected."
        )


    # In case the model accidentally generates
    # more questions, keep only the requested count.

    return parsed_questions[:count]


# ============================================================
# PARSE QUESTIONS
# ============================================================

def parse_questions(
    response: str,
) -> list[str]:

    question_list = []


    lines = response.splitlines()


    for line in lines:

        line = line.strip()


        if not line:

            continue


        # Remove markdown bullet if model adds one.

        line = re.sub(
            r"^[-*]\s*",
            "",
            line,
        )


        # Match:
        #
        # 1. Question
        # 2) Question
        # 3 - Question

        match = re.match(
            r"^\d+\s*[\.\)\-:]\s*(.+)$",
            line,
        )


        if match:

            question = (
                match.group(1)
                .strip()
            )

            if question:

                question_list.append(
                    question
                )


    return question_list