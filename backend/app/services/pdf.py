from pypdf import PdfReader
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import Pinecone as PineconeVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from typing import List, Dict, Optional
import re
import os

class PDFProcessor:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

        # Initialize Pinecone
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        index_name = os.getenv("PINECONE_INDEX")

        self.pinecone = Pinecone(api_key=pinecone_api_key)

        # Get list of existing indexes
        existing_indexes = [index["name"] for index in self.pinecone.list_indexes()]

        # Create index if it doesn't exist
        if index_name not in existing_indexes:
            self.pinecone.create_index(
                index_name,
                dimension=1536,  
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )

        # Initialize Pinecone vector store
        self.vector_store = PineconeVectorStore.from_existing_index(index_name, self.embeddings)
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text for better processing."""
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        # Remove page numbers
        text = re.sub(r'\b\d+\b(?=\s*$)', '', text)
        # Fix common PDF extraction issues
        text = text.replace('•', '')  # Remove bullets
        text = text.replace('|', 'I')  # Common OCR error
        # Remove headers/footers (basic approach)
        lines = text.split('\n')
        if len(lines) > 2:
            lines = [line for line in lines if len(line.strip()) > 20]  # Remove short header/footer lines
        return '\n'.join(lines).strip()

    def get_context_window(self, text: str) -> List[Dict[str, str]]:
        """Split text while preserving section context."""
        # First, identify potential section breaks
        section_pattern = r'(?i)^(chapter|section)\s+[\d\w]+[:.]?\s*([^\n]+)'
        sections = []
        current_section = ""
        current_title = "Introduction"  # Default title
        
        for line in text.split('\n'):
            section_match = re.match(section_pattern, line)
            if section_match:
                if current_section:
                    sections.append({"title": current_title, "content": current_section.strip()})
                current_title = section_match.group(2)
                current_section = ""
            else:
                current_section += line + "\n"
                
        if current_section:
            sections.append({"title": current_title, "content": current_section.strip()})
            
        return sections

    def split_into_chunks(self, section: Dict[str, str]) -> List[Dict]:
        """Split text into chunks while preserving semantic meaning."""
        splitter = RecursiveCharacterTextSplitter(
            separators=["\n\n", "\n", ". ", " "],
            chunk_size=500,  # Smaller chunks for more precise retrieval
            chunk_overlap=50,  # Minimal overlap to maintain context
            length_function=len,
        )
        
        chunks = splitter.split_text(section["content"])
        
        # Post-process chunks to ensure they end at sentence boundaries
        processed_chunks = []
        for chunk in chunks:
            # Ensure chunk ends at a sentence boundary
            if not chunk.endswith(('.', '!', '?')):
                last_sentence_end = max(
                    chunk.rfind('.'),
                    chunk.rfind('!'),
                    chunk.rfind('?')
                )
                if last_sentence_end != -1:
                    chunk = chunk[:last_sentence_end + 1]
            
            processed_chunks.append({
                "content": chunk.strip(),
                "section": section["title"]
            })
            
        return processed_chunks

    def process_pdf(self, file_path: str) -> List[str]:
        """Process PDF with improved chunking and context preservation."""
        pdf_reader = PdfReader(file_path)
        all_chunks = []
        
        for page_num, page in enumerate(pdf_reader.pages, start=1):
            # Extract and clean text
            text_content = page.extract_text()
            cleaned_text = self.clean_text(text_content)
            
            # Get sections with context
            sections = self.get_context_window(cleaned_text)
            
            # Process each section
            for section in sections:
                
                chunks = self.split_into_chunks(section)


                # Store embeddings in Pinecone
                for chunk in chunks:
                    metadata = {
                        "source": os.path.basename(file_path),
                        "page": page_num,
                        "section": chunk["section"],
                    }
                    self.vector_store.add_texts(
                        texts=[chunk["content"]],
                        metadatas=[metadata]
                    )
                    
                all_chunks.extend([chunk["content"] for chunk in chunks])

        # ✅ Delete file after processing
        os.remove(file_path)
        
        return all_chunks


    def get_relevant_chunks(self, query: str, k: int = 3) -> List[Dict]:
        """Get relevant chunks with improved context."""
        # Get slightly more chunks than needed for post-processing
        docs = self.vector_store.similarity_search(query, k=k+2)
        
        # Post-process to ensure we're getting the best chunks
        processed_docs = []
        seen_sections = set()
        
        for doc in docs:
            section = doc.metadata["section"]
            # Avoid duplicate sections unless they're highly relevant
            if section not in seen_sections or len(processed_docs) < 2:
                processed_docs.append(doc)
                seen_sections.add(section)
                
            if len(processed_docs) >= k:
                break
                
        return processed_docs[:k]