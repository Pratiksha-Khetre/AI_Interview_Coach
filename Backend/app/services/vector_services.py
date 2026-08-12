from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from pathlib import Path


_embedding_model = None


def get_embedding_model():
    global _embedding_model

    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

    return _embedding_model


def create_vector_store(documents: list[Document]):
    embedding_model = get_embedding_model()

    vector_store = FAISS.from_documents(
        documents,
        embedding_model
    )

    return vector_store


def save_vector_store(vector_store: FAISS, resume_id: str) -> None:

    store_dir = Path("vector_store") / resume_id
    store_dir.mkdir(parents=True, exist_ok=True)

    vector_store.save_local(store_dir)


def load_vector_store(resume_id: str) -> FAISS:

    store_dir = Path("vector_store") / resume_id

    embedding_model = get_embedding_model()

    vector_store = FAISS.load_local(
        store_dir,
        embedding_model,
        allow_dangerous_deserialization=True
    )

    return vector_store