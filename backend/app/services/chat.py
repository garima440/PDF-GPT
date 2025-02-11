from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from .pdf import PDFProcessor
from typing import Dict, List, Tuple
import os

class ChatService:
    def __init__(self, vector_store):
        self.pdf_processor = PDFProcessor()
        self.vector_store = vector_store
        self.llm = ChatOpenAI(temperature=0.7, api_key=os.getenv("OPENAI_API_KEY"))
        self.chat_history = []
        
    def get_response(self, message: str) -> Tuple[str, List[str]]:
        """Get response from the AI using RAG for documents or direct chat for general conversation."""
        try:
            # First try document-based chat
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=self.vector_store.as_retriever(),
                return_source_documents=True
            )
            
            result = qa_chain.invoke({
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
        except Exception as e:
            print(f"Error in get_response: {str(e)}")
            # If document-based chat fails, fall back to general conversation
            response = self.llm.predict(message)
            return response, []
