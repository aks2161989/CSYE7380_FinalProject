from rag_chat import TraderRAGChatbot


def main():
    bot = TraderRAGChatbot()

    print("Warren Buffett RAG Chatbot")
    print("Type 'exit' to quit.\n")

    while True:
        query = input("Ask a question: ").strip()
        if query.lower() in {"exit", "quit"}:
            print("Goodbye.")
            break

        result = bot.answer(query)

        print("\n--- Answer ---")
        print(result["answer"])

        print("\n--- Sources Used ---")
        for src in result["sources"]:
            print(
                f"Sheet={src.get('sheet')} | "
                f"Label={src.get('label')} | "
                f"Row={src.get('row_number')} | "
                f"Question={src.get('question')}"
            )
        print()


if __name__ == "__main__":
    main()