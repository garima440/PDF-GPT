from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.pdf import PDFProcessor
from .services.chat import ChatService
import os
import boto3
from dotenv import load_dotenv

from pydantic import BaseModel, Field


load_dotenv()

app = FastAPI()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
chat_service = ChatService(pdf_processor.vector_store)


class ChatQuery(BaseModel):
    query: str

# S3 client setup
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
bucket_name = os.getenv("S3_BUCKET_NAME")


UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a PDF."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        pdf_processor.process_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

    os.remove(file_path)
    return {"message": "Document processed successfully", "document_id": file.filename}    


@app.post("/chat")
async def chat(chat_query: ChatQuery):
    """Handle chat queries by automatically checking for documents"""
    print(f"Chat query received - Query: {chat_query.query}")
    
    try:
        # First check if there are any documents
        documents = pdf_processor.list_documents()
        has_documents = len(documents) > 0
        
        if has_documents:
            print("Documents found, checking relevance")
            response, sources = chat_service.get_document_response(chat_query.query)
            
            # Only return sources if we're returning a document-based response
            if sources:  # If sources is non-empty, it means we used documents
                return {
                    "response": response,
                    "sources": sources
                }
            else:  # If no sources, it means we fell back to general chat
                return {
                    "response": response
                }
        else:
            print("No documents found, using general chat")
            response = chat_service.get_general_response(chat_query.query)
            return {
                "response": response
            }
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) 
    
@app.get("/list")
def list_documents():
    """List PDF files from both S3 and Pinecone."""
    try:
        documents = pdf_processor.list_documents()
        return {"documents": documents}
    except Exception as e:
        print(f"Error in list_documents: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error listing documents: {str(e)}"
        )

@app.delete("/delete/{filename}")
async def delete_document(filename: str):
    """Delete a document from both S3 and Pinecone."""
    try:
        print(f"Delete request received for: {filename}")
        result = pdf_processor.delete_document(filename)
        print(f"Delete result: {result}")
        return result
    except Exception as e:
        print(f"Error in delete endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
