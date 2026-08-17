from app.services import vector_services


def retrieve_context(
    resume_id: str,
    query: str,
    k: int = 5
):
    vector_store = vector_services.load_vector_store(resume_id)

    results = vector_services.search_vector_store(
        vector_store,
        query,
        k=k
    )

    documents = [
        result["document"]
        for result in results
    ]

    return documents