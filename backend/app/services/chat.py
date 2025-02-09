from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from .pdf import PDFProcessor
from typing import Dict, List, Tuple
import os

class ChatService:
    def __init__(self):
        self.pdf_processor = PDFProcessor()
        self.llm = ChatOpenAI(temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
        self.chat_history = []
        
    def get_response(self, message: str) -> Tuple[str, List[str]]:
        """Get response from the AI using RAG."""
        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.pdf_processor.vector_store.as_retriever(),
            return_source_documents=True
        )
        
        result = qa_chain({
            "question": message,
            "chat_history": self.chat_history
        })
        
        self.chat_history.append((message, result["answer"]))
        
        sources = [
            f"Document: {doc.metadata.get('source', 'Unknown')}, "
            f"Page: {doc.metadata.get('page', 'Unknown')}"
            for doc in result.get("source_documents", [])
        ]
        
        return result["answer"], sources
