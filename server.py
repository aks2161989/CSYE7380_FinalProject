"""
server.py -- FastAPI wrapper around the existing RAG pipeline.

Run with:  uvicorn server:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Buffett RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(req: QuestionRequest):
    from rag_chain import ask

    return ask(req.question)
