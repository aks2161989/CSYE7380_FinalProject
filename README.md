# CSYE7380 – Trader Chatbot (RAG)

## 🚀 Setup Instructions

### 1. Create virtual environment
python -m venv venv

### 2. Activate (Windows)
venv\Scripts\activate

### 3. Install dependencies
pip install -r requirements.txt


---

## 🔑 Environment Setup

Create a file named `.env` in the root folder:

GROQ_API_KEY=your_groq_api_key_here  
GOOGLE_SHEET_ID=1dyCNyq6mt32i0iOR1tT_ume6vSPHJWTqLbN5FGnPKFY  
GROQ_MODEL=llama-3.1-8b-instant  

⚠️ Make sure the Google Sheet is set to:
**"Anyone with the link can view"**

---

## 📊 Step 1: Build Vector Database

Run:

python src/ingest.py

This will:
- Load all sheets (Personal Life, Strategy, etc.)
- Create embeddings
- Store FAISS index in `vector_store/`

---

## 🤖 Step 2: Run Chatbot

Run:

python src/main.py

Example questions:
- How did Buffett’s childhood influence his mindset?
- What is his risk management philosophy?
- How does he decide entry and exit timing?

---

## 📁 Project Structure

src/
- ingest.py → builds vector database  
- rag_chat.py → RAG pipeline  
- main.py → CLI chatbot  

vector_store/ → generated automatically (not committed)

---

## ⚠️ Notes

- `.env` is required (API key will NOT be shared in repo)
- First run of `ingest.py` may take a few minutes
- If chatbot fails, ensure:
  - `.env` is correct
  - internet is working
  - dependencies are installed

---

## 💡 Optional

If you don’t have a Groq API key, chatbot will not generate answers.