# Backend\app\services\retrieval_service.py

from langchain_core.documents import Document
from app.services import vector_services

def retrieve_context(resume_id : str, query : str, k : int = 3) -> list[Document]:

    vector_store = vector_services.load_vector_store(resume_id)

    documents = vector_store.similarity_search(query, k = k)

    return documents