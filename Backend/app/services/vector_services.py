# Backend\app\services\vector_services.py

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from pathlib import Path

EMBEDDDING_MODEL = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-MiniLM-L6-v2")

def create_vector_store(documents : list[Document]):
    vector_store = FAISS.from_documents(documents, EMBEDDDING_MODEL)       #FAISS stores associated documets + embeddings

    return vector_store


def save_vector_store(vector_store : FAISS, resume_id : str) -> None:

    store_dir = Path("vector_store") / resume_id
    store_dir.mkdir(parents=True, exist_ok=True)

    vector_store.save_local(store_dir)


def load_vector_store(resume_id : str) -> FAISS:

    store_dir = Path("vector_store") / resume_id

    vector_store = FAISS.load_local(store_dir, EMBEDDDING_MODEL, allow_dangerous_centralization = True)

    return vector_store

