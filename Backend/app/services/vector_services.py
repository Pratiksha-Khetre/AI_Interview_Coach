from pathlib import Path
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from langchain_core.documents import Document


VECTOR_STORE_DIR = Path("vector_store")


def create_vector_store(documents: list[Document]):

    texts = [doc.page_content for doc in documents]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=5000
    )

    vectors = vectorizer.fit_transform(texts)

    return {
        "documents": documents,
        "vectorizer": vectorizer,
        "vectors": vectors
    }


def save_vector_store(vector_store, resume_id: str):

    store_dir = VECTOR_STORE_DIR / resume_id
    store_dir.mkdir(parents=True, exist_ok=True)

    with open(store_dir / "store.pkl", "wb") as f:
        pickle.dump(vector_store, f)


def load_vector_store(resume_id: str):

    store_dir = VECTOR_STORE_DIR / resume_id

    with open(store_dir / "store.pkl", "rb") as f:
        return pickle.load(f)


def search_vector_store(
    vector_store,
    query: str,
    k: int = 5
):

    vectorizer = vector_store["vectorizer"]
    vectors = vector_store["vectors"]
    documents = vector_store["documents"]

    query_vector = vectorizer.transform([query])

    similarities = cosine_similarity(
        query_vector,
        vectors
    )[0]

    top_indices = similarities.argsort()[-k:][::-1]

    results = []

    for index in top_indices:
        results.append({
            "document": documents[index],
            "score": float(similarities[index])
        })

    return results