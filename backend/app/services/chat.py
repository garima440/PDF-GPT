from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from .pdf import PDFProcessor
from typing import Dict, List, Tuple
import os

class ChatService:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.llm = ChatOpenAI(
            temperature=0.1,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.doc_chat_history = []

    def is_general_query(self, message: str) -> bool:
        """Simple keyword check for general queries."""
        general_keywords = ["hello", "hi", "how are you", "what's up", "greeting", "Nice", "thanks", "great", "good", "got, it"]  # Expand as needed
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in general_keywords)

    def get_document_response(self, message: str) -> Tuple[str, List[str]]:
        try:
            print(f"Processing query: {message}")

            # [STRATEGY 2] - Keyword-Based Filter
            if self.is_general_query(message):
                print("Identified as a general query based on keywords.")
                response = self.get_general_response(message)
                return response, []
            
            # Use search_with_score to get relevance scores
            retriever = self.vector_store.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs={
                    "k": 3,
                    "score_threshold": 0.87 # Adjust this threshold
                }
            )
            
            results = retriever.invoke(message)

            # If no relevant documents or very low similarity, use general chat
            if not results:
                print("No sufficiently relevant documents found, using general chat")
                response = self.get_general_response(message)
                return response, []
            
            # If we found relevant documents, use them
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=retriever,
                return_source_documents=True
            )
            
            result = qa_chain.invoke({
                "question": message,
                "chat_history": self.doc_chat_history
            })
            
            sources = [
                f"[Page {doc.metadata.get('page', '?')}] {doc.page_content[:150]}... (From: {os.path.basename(doc.metadata.get('source', 'Unknown'))})"
                for doc in result.get("source_documents", [])
            ]
            
            return result["answer"], sources
            
        except Exception as e:
            print(f"Error in get_document_response: {str(e)}")
            return "Sorry, I encountered an error. Please try again.", []

    def get_general_response(self, message: str) -> str:
        """Handle general conversation without documents."""
        response = self.llm.invoke(message)
        return response
