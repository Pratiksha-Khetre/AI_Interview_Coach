# Backend\app\services\resume_service.py

from fastapi import UploadFile, File
from pathlib import Path 
from fastapi import HTTPException
import shutil
import uuid

from app.services import parser_service
from app.services import rag_service
from app.services import vector_services

upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok = True)

def upload_resume(file : UploadFile = File(...)):

    extension = Path(file.filename).suffix.lower()

    if extension != ".pdf" :
        raise HTTPException(status_code = 400, detail="The file is not in PDF format")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Only PDF files are allowed.")
            
    unique_id = str(uuid.uuid4())

    new_filename = f"{unique_id}{extension}"

    file_path = upload_dir / new_filename

    file.file.seek(0, 2)        # keep the cursor @ end of file

    file_size = file.file.tell() 

    file.file.seek(0)       # keep the cursor at start of file

    MAX_FILE_SIZE = 5 * 1024 * 1024

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must not exceed 5 MB.")


    with open(file_path,"wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # return{
    #     "message": "Resume received successfully",
    #     "original_filename": file.filename,
    #     "stored_filename" : new_filename
    # }


    text = parser_service.parse_resume(file_path)

    chunks = rag_service.chunk_text(text)

    doc = rag_service.create_document(chunks, metadata= {"resume_id" : unique_id, "file_path": str(file_path)})

    create_store = vector_services.create_vector_store(doc)

    vector_services.save_vector_store(create_store, resume_id= unique_id)

    return{
        "message" : "Resume Uploaded Successfully !! 🤩",
        "resume_id" : unique_id
    }