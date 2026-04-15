import os
from dotenv import load_dotenv

from groq import Groq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


class TraderRAGChatbot:
    def __init__(self) -> None:
        load_dotenv()

        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama3-8b-8192")
        self.embedding_model_name = os.getenv(
            "EMBEDDING_MODEL",
            "sentence-transformers/paraphrase-MiniLM-L6-v2"
        )
        self.vector_db_path = os.getenv("VECTOR_DB_PATH", "vector_store/warren_buffett_faiss")
        self.top_k = int(os.getenv("TOP_K", "4"))

        embeddings = HuggingFaceEmbeddings(model_name=self.embedding_model_name)
        self.vector_db = FAISS.load_local(
            self.vector_db_path,
            embeddings,
            allow_dangerous_deserialization=True,
        )

        self.client = Groq(api_key=self.groq_api_key) if self.groq_api_key else None

    def retrieve(self, query: str):
        return self.vector_db.similarity_search(query, k=self.top_k)

    @staticmethod
    def build_context(docs) -> str:
        context_parts = []
        for i, doc in enumerate(docs, start=1):
            meta = doc.metadata
            context_parts.append(
                f"[Context {i}]\n"
                f"Sheet: {meta.get('sheet', 'Unknown')}\n"
                f"Label: {meta.get('label', 'Unknown')}\n"
                f"Question: {meta.get('question', 'Unknown')}\n"
                f"Content:\n{doc.page_content}\n"
            )
        return "\n".join(context_parts)

    def answer(self, query: str) -> dict:
        docs = self.retrieve(query)
        context = self.build_context(docs)

        if not self.client:
            return {
                "answer": "GROQ_API_KEY is not set. Retrieval worked, but generation is disabled.",
                "context": context,
                "sources": [doc.metadata for doc in docs],
            }

        prompt = f"""
You are a Warren Buffett trader/investor chatbot built from team-prepared study material.

Answer the user's question using ONLY the retrieved context below.
If the answer is not clearly supported by the context, say:
"I don't have enough grounded information in the dataset to answer that confidently."

Retrieved Context:
{context}

User Question:
{query}

Instructions:
- Be concise but informative.
- Prefer grounded facts from the retrieved context.
- If helpful, mention the relevant label category.
"""

        response = self.client.chat.completions.create(
            model=self.groq_model,
            messages=[{"role": "user", "content": prompt}],
        )

        return {
            "answer": response.choices[0].message.content,
            "context": context,
            "sources": [doc.metadata for doc in docs],
        }