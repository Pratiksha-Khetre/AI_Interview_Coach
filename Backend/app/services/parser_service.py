# Backend\app\services\parser_service.py

from pathlib import Path
import pymupdf

def parse_resume(file_path : Path) -> str:

    text = ""

    try:
        doc = pymupdf.open(file_path)
        for page in doc:
            text += page.get_text()
    finally:
        doc.close()

    return text
