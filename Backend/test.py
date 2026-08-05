from google.genai import Client
import os
from dotenv import load_dotenv

load_dotenv()

client = Client(api_key=os.getenv("GEMINI_API_KEY"))

for model in client.models.list():
    print(model.name)