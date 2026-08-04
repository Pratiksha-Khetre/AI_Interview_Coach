# Backend\app\services\parser_service.py

from pathlib import Path
import fitz

def parse_resume(file_path : Path) -> str:

    text = ""

    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
    finally:
        doc.close()

    return text