from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    message: str
    
class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None

class DocumentResponse(BaseModel):
    message: str
    document_id: str