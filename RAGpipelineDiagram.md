flowchart TD
    A["User Question"] --> B["Embed Question with MiniLM-L6-v2"]
    B --> C["FAISS Similarity Search - Top 5 chunks"]
    C --> D["Select Top 3 chunks as context"]
    D --> E["Build Prompt - truncated to 512 tokens"]
    A --> E
    E --> F{"GROQ_API_KEY set?"}
    F -- Yes --> G["Groq Llama 3"]
    F -- No --> H["FLAN-T5-base (local)"]
    G --> I["Answer + Source Metadata"]
    H --> I