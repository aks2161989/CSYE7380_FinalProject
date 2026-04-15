import os
from io import BytesIO

import pandas as pd
import requests
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


def download_google_sheet_xlsx(sheet_id: str) -> BytesIO:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return BytesIO(response.content)


def normalize_sheet(df: pd.DataFrame, sheet_name: str) -> pd.DataFrame:
    df = df.copy()

    # Normalize column names
    df.columns = [str(col).strip() for col in df.columns]

    # Keep only the columns we care about
    # Your first column is serial number; drop it if present
    expected = {"Questions", "Answers", "Label"}
    existing = set(df.columns)

    if not expected.issubset(existing):
        # Try dropping first column and re-checking
        if len(df.columns) >= 4:
            df = df.iloc[:, 1:4]
            df.columns = [str(col).strip() for col in df.columns]

    if not expected.issubset(set(df.columns)):
        raise ValueError(
            f"Sheet '{sheet_name}' does not contain required columns: Questions, Answers, Label. "
            f"Found: {list(df.columns)}"
        )

    df = df[["Questions", "Answers", "Label"]].copy()
    df = df.dropna(subset=["Questions", "Answers", "Label"])

    # Clean whitespace
    for col in ["Questions", "Answers", "Label"]:
        df[col] = df[col].astype(str).str.strip()

    # Remove empty rows
    df = df[
        (df["Questions"] != "") &
        (df["Answers"] != "") &
        (df["Label"] != "")
    ].reset_index(drop=True)

    return df


def dataframe_to_documents(df: pd.DataFrame, sheet_name: str) -> list[Document]:
    documents = []
    for idx, row in df.iterrows():
        text = (
            f"Sheet: {sheet_name}\n"
            f"Label: {row['Label']}\n"
            f"Question: {row['Questions']}\n"
            f"Answer: {row['Answers']}"
        )
        documents.append(
            Document(
                page_content=text,
                metadata={
                    "sheet": sheet_name,
                    "label": row["Label"],
                    "row_number": idx + 2,  # +2 assuming header row starts at 1
                    "question": row["Questions"],
                },
            )
        )
    return documents


def build_vector_store(documents: list[Document], embedding_model_name: str, save_path: str) -> None:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )
    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name)
    vector_db = FAISS.from_documents(chunks, embeddings)
    vector_db.save_local(save_path)

    print(f"Saved FAISS vector store to: {save_path}")
    print(f"Original documents: {len(documents)}")
    print(f"Chunked documents: {len(chunks)}")


def main() -> None:
    load_dotenv()

    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    embedding_model = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-MiniLM-L6-v2")
    save_path = os.getenv("VECTOR_DB_PATH", "vector_store/warren_buffett_faiss")

    if not sheet_id:
        raise ValueError("GOOGLE_SHEET_ID is missing in .env")

    xlsx_data = download_google_sheet_xlsx(sheet_id)
    all_sheets = pd.read_excel(xlsx_data, sheet_name=None)

    all_documents = []
    for sheet_name, df in all_sheets.items():
        clean_df = normalize_sheet(df, sheet_name)
        docs = dataframe_to_documents(clean_df, sheet_name)
        all_documents.extend(docs)
        print(f"Processed sheet '{sheet_name}' with {len(clean_df)} rows.")

    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    build_vector_store(all_documents, embedding_model, save_path)


if __name__ == "__main__":
    main()