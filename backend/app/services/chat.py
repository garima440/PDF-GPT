from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.schema import Document
import os

from langchain_community.vectorstores import Pinecone
from langchain_community.retrievers import BM25Retriever

class ChatService:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.llm = ChatOpenAI(
            temperature=0.1,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.doc_chat_history = []
        self.embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

        # Predefine general conversation queries
        self.general_queries = [
            "hello", "hi", "how are you", "what's up", "thank you", "tell me a joke"
        ]
        self.general_embeddings = self.embeddings.embed_documents(self.general_queries)

        # BM25 Retriever (Keyword-based search)
        self.bm25_retriever = BM25Retriever(docs=[])

    def is_general_query(self, message: str) -> bool:
        """Determine if a query is a general conversation query using embeddings."""
        query_embedding = self.embeddings.embed_query(message)
        similarity_scores = [
            self.cosine_similarity(query_embedding, general_embedding)
            for general_embedding in self.general_embeddings
        ]
        return max(similarity_scores) > 0.9

    def cosine_similarity(self, vec1, vec2):
        return sum(a * b for a, b in zip(vec1, vec2)) / (
            (sum(a**2 for a in vec1) ** 0.5) * (sum(b**2 for b in vec2) ** 0.5)
        )

    def get_document_response(self, message: str):
        try:
            if self.is_general_query(message):
                return self.get_general_response(message), []

            retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 5}
            )
            
            results = retriever.invoke(message)

            if not results:
                return self.get_general_response(message), []

            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=retriever,
                return_source_documents=True
            )
            result = qa_chain.invoke({
                "question": message,
                "chat_history": self.doc_chat_history
            })

            # Improved source processing
            seen_content = set()
            filtered_sources = []
            
            for doc in result.get("source_documents", []):
                # Skip if no meaningful content
                if not doc.page_content.strip():
                    continue
                
                # Create a content fingerprint (first 100 chars)
                content_key = doc.page_content[:100]
                if content_key in seen_content:
                    continue
                
                seen_content.add(content_key)
                
                # Only include sources that are likely relevant
                # Extract semantic similarity using embeddings instead of LLM scoring
                relevance_score = self.cosine_similarity(
                    self.embeddings.embed_query(message),
                    self.embeddings.embed_query(doc.page_content[:200])
                )
                if relevance_score < 0.7:  # Adjust threshold as needed
                    continue
                
                # Format source with better context
                source_text = doc.page_content.strip()
                if len(source_text) > 150:
                    # Find the most relevant sentence
                    sentences = source_text.split('.')
                    most_relevant = max(sentences, key=lambda s: self.cosine_similarity(
                        self.embeddings.embed_query(s),
                        self.embeddings.embed_query(message)
                    ))
                    source_text = most_relevant.strip() + "..."
                
                filtered_sources.append(
                    f"[Page {doc.metadata.get('page', '?')}] {source_text} "
                    f"(From: {os.path.basename(doc.metadata.get('source', 'Unknown'))})"
                )
                
                # Limit to top 3 most relevant sources
                if len(filtered_sources) >= 3:
                    break

            return result["answer"], filtered_sources

        except Exception as e:
            print(f"Error in get_document_response: {str(e)}")
            return "Sorry, I encountered an error. Please try again.", []

    def get_general_response(self, message: str) -> str:
        """Handle general conversation without documents."""
        response = self.llm.invoke(message)
        return response