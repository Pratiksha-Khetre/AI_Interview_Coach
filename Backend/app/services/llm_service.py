# Backend\app\services\llm_service.py
# this service is responsible only for the context + prompt + LLM -> Question generation

from langchain_core.documents import Document
from dotenv import load_dotenv
from google.genai import Client
from app.services import retrieval_service
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if api_key is None:
    raise ValueError()

client = Client(api_key = api_key)

MODEL_NAME = "models/gemini-flash-latest"

def get_question_count(duration : int) -> int:

    number_of_questions = 0

    if duration == 20:
        number_of_questions = 8
    elif duration == 30:
        number_of_questions = 12
    elif duration == 45:
        number_of_questions = 18
    else:               # as 60 min is last option to be select in the UI
        number_of_questions = 25

    return number_of_questions

def build_question_generation_prompt(context : list[Document], role : str, difficulty : str, interview_type : str, duration : int, number_of_questions : int ) -> str:

    context_text = "\n\n".join(
        doc.page_content
        for doc in context
    )

    prompt = f"""You are an experienced technical interviewer.

    Your task is to conduct a realistic interview for the candidate.

    Interview Details:
    - Role: {role}
    - Interview Type: {interview_type}
    - Difficulty: {difficulty}
    - Total Interview Duration: {duration} minutes
    - Number of Questions to Generate: {number_of_questions}

    Candidate Resume Context:
    {context_text}

    Instructions:
    1. Generate interview questions strictly using the provided resume context.
    2. Ask questions that are relevant to the candidate's projects, internships, technical skills, and experience.
    3. Do not invent any experience or information that is not present in the resume.
    4. Do not ask generic interview questions unless they are directly related to the candidate's resume.
    5. Ask questions naturally, as a real interviewer would during a face-to-face interview.
    6. The questions should gradually increase in difficulty.
    7. Generate exactly {number_of_questions} questions.
    8. Return ONLY the numbered interview questions.
    Do not include greetings, introductions, explanations, markdown formatting, or any additional text.
    9. Do not provide answers, hints, explanations, or any additional text.
    10. Focus primarily on projects, internships, technical skills, certifications, achievements, and work experience before asking theoretical questions.
    11. If the resume does not contain enough information, ask role-specific questions instead of inventing resume details."""

    return prompt


def generate_questions(prompt : str) -> str:

    response = client.models.generate_content(model= MODEL_NAME, contents =  prompt)

    return response.text


def build_retrieval_query(role : str, interview_type : str) -> str:
    return f"{role}, {interview_type} interview"


def generate_interview_questions(resume_id : str, interview_type : str, difficulty : str, role : str, duration : int) -> str:

    query = build_retrieval_query(role, interview_type)

    retrieved_context = retrieval_service.retrieve_context(resume_id, query)

    count = get_question_count(duration)

    prompt = build_question_generation_prompt(retrieved_context, role, difficulty, interview_type, duration, count)

    questions = generate_questions(prompt)

    parsed_questions = parse_questions(questions)

    return parsed_questions

def parse_questions(response : str) -> list[str]:

    question_list = []

    lines = response.split("\n")

    for line in lines:

        line = line.strip()

        if line == "":
            continue

        parts = line.split(".", 1)

        if(len(parts) < 2):
            continue

        question = parts[1].strip()

        question_list.append(parts[1].strip())

    return question_list