from fastapi import HTTPException
from pypdf import PdfReader
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import Pinecone as PineconeVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from typing import List, Dict, Optional
import re
import os
import boto3

class PDFProcessor:
    def __init__(self):

        self.embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

        # Initialize Pinecone
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        index_name = os.getenv("PINECONE_INDEX")

        self.pinecone = Pinecone(api_key=pinecone_api_key)

        # Initialize S3
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        self.s3_bucket = os.getenv("S3_BUCKET_NAME")

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
        """Process PDF while keeping a stored copy."""
        file_name = os.path.basename(file_path)
        file_url = self.upload_to_s3(file_path, file_name)  # Upload file

        pdf_reader = PdfReader(file_path)
        all_chunks = []

        for page_num, page in enumerate(pdf_reader.pages, start=1):
            text_content = page.extract_text()
            cleaned_text = self.clean_text(text_content)
            sections = self.get_context_window(cleaned_text)

            for section in sections:
                chunks = self.split_into_chunks(section)

                # Store embeddings in Pinecone with S3 URL
                for chunk in chunks:
                    metadata = {
                        "source": file_url,  # Store file URL instead of just name
                        "page": page_num,
                        "section": chunk["section"],
                    }
                    self.vector_store.add_texts(
                        texts=[chunk["content"]],
                        metadatas=[metadata]
                    )

                all_chunks.extend([chunk["content"] for chunk in chunks])
        
        # Add this after storing embeddings
        print(f"Stored {len(all_chunks)} chunks in Pinecone")
        # Print a sample chunk to verify content
        if all_chunks:
            print(f"Sample chunk: {all_chunks[0][:200]}")

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
    
    def list_documents(self):
        """List documents from both S3 and Pinecone."""
        documents = set()  # Use set to avoid duplicates
        
        try:
            # Get documents from S3
            s3_response = self.s3_client.list_objects_v2(Bucket=self.s3_bucket)
            if s3_response.get('KeyCount', 0) > 0:
                for obj in s3_response.get("Contents", []):
                    if obj["Key"].endswith(".pdf"):
                        documents.add((
                            obj["Key"],  # file_name
                            f"https://{self.s3_bucket}.s3.amazonaws.com/{obj['Key']}"  # file_url
                        ))
            
            # Get documents from Pinecone
            index = self.pinecone.Index(os.getenv("PINECONE_INDEX"))
            stats = index.describe_index_stats()
            
            # Extract unique source URLs from Pinecone metadata
            pinecone_docs = stats.get("stats", {}).get("metadata_field_values", {}).get("source", {})
            if pinecone_docs:
                for url in pinecone_docs:
                    if url.endswith(".pdf"):
                        file_name = url.split("/")[-1]  # Extract filename from URL
                        documents.add((file_name, url))
            
            # Convert set to list of dictionaries
            return [
                {
                    "file_name": file_name,
                    "file_url": file_url
                }
                for file_name, file_url in documents
            ]
            
        except Exception as e:
            print(f"Error listing documents: {str(e)}")
            raise e

    def delete_document(self, document_id: str):
        """Delete document from both S3 and Pinecone."""
        try:
            print(f"Starting deletion of document: {document_id}")

            # Construct S3 file URL (since it's stored as metadata in Pinecone)
            file_url = f"https://{self.s3_bucket}.s3.amazonaws.com/{document_id}"

            # Step 1: Delete from S3
            try:
                # Check if file exists
                s3_response = self.s3_client.list_objects_v2(Bucket=self.s3_bucket, Prefix=document_id)
                if 'Contents' in s3_response:
                    self.s3_client.delete_object(Bucket=self.s3_bucket, Key=document_id)
                    print(f"Successfully deleted from S3: {document_id}")
                else:
                    print(f"File {document_id} not found in S3.")
            except Exception as e:
                print(f"Error deleting from S3: {str(e)}")
                raise e

            # Step 2: Delete embeddings from Pinecone
            try:
                index = self.pinecone.Index(os.getenv("PINECONE_INDEX"))

                # Search for all vector IDs related to the file
                query_results = index.query(
                    vector=[0] * 1536,  # Dummy vector to retrieve all metadata
                    filter={"source": file_url},
                    top_k=1000,  # Assuming no more than 1000 vectors per file
                    include_metadata=True
                )

                # Extract vector IDs
                vector_ids = [match["id"] for match in query_results.get("matches", [])]

                if vector_ids:
                    delete_response = index.delete(ids=vector_ids)
                    print(f"Pinecone delete response: {delete_response}")
                else:
                    print("No embeddings found for deletion in Pinecone.")

                # Verify deletion
                after_stats = index.describe_index_stats()
                print(f"After deletion - Index stats: {after_stats}")

            except Exception as e:
                print(f"Error deleting from Pinecone: {str(e)}")
                raise e

            return {"message": f"Successfully deleted {document_id} from both S3 and Pinecone"}

        except Exception as e:
            print(f"Error in delete_document: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error deleting document: {str(e)}"
            )



    def upload_to_s3(self, file_path: str, file_name: str) -> str:
        """Upload PDF to S3 and return its URL."""
        self.s3_client.upload_file(file_path, self.s3_bucket, file_name)
        file_url = f"https://{self.s3_bucket}.s3.amazonaws.com/{file_name}"
        return file_url
