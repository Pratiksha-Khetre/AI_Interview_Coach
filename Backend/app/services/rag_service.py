# Backend\app\services\rag_service.py

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def chunk_text(text : str, chunk_size = 500, chunk_overlap = 50) -> list[str]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = chunk_size,
        chunk_overlap = chunk_overlap,
        length_function = len,
        separators = ["\n\n", "\n", " ", ""]
    )

    chunks = text_splitter.split_text(text)

    return chunks

# from sentence_transformers import SentenceTransformer
# model = SentenceTransformer("all-MiniLM-L6-v2")

# def create_embeddings(chunks : list[str]):

#     embeddings = model.encode(chunks)

#     return embeddings



def create_document(chunks : list[str], metadata : dict) -> list[Document]:
    documents = []
    
    for chunk in chunks:

        document = Document(
            page_content= chunk,
            metadata = metadata
        )

        documents.append(document)

    return documents
