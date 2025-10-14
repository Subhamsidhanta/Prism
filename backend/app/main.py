from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
import logging
from typing import Optional
import uuid

from .services.qa_service import qa_service
from .services.llm_service import mistral_llm
from .services.progress_service import progress_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Prism Document Q&A API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure data directories exist
Path("data/uploads").mkdir(parents=True, exist_ok=True)
Path("data/processed").mkdir(parents=True, exist_ok=True)

# Pydantic models
class QuestionRequest(BaseModel):
    question: str
    file_id: Optional[str] = None

class QuestionResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    sources: Optional[list] = None
    chunks_used: Optional[int] = None
    error: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []

class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    model_info: Optional[dict] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Prism Document Q&A API",
        "version": "1.0.0",
        "llm_ready": mistral_llm.is_ready(),
        "model_name": getattr(mistral_llm, "model_name", "unknown")
    }

@app.get("/api/processing-status/{file_id}")
async def get_processing_status(file_id: str):
    """
    Get processing status for a file
    """
    try:
        progress = progress_service.get_progress(file_id)
        if not progress:
            raise HTTPException(status_code=404, detail="Processing status not found")
        
        return {
            "success": True,
            "file_id": progress.file_id,
            "status": progress.status,
            "percentage": progress.progress,
            "message": progress.current_step,
            "current_step_number": progress.current_step_number,
            "total_steps": progress.total_steps,
            "estimated_remaining": progress.estimated_remaining,
            "error_message": progress.error_message
        }
    except Exception as e:
        logger.error(f"Processing status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def process_document_async(file_path: str, file_id: str, processing_id: str):
    """Background task to process document with progress tracking"""
    try:
        # Start progress tracking
        progress_service.start_processing(processing_id, total_steps=3)
        
        # Process document with progress tracking
        result = qa_service.process_document_with_progress(str(file_path), file_id, processing_id)
        
        if result["success"]:
            progress_service.complete_processing(processing_id)
        else:
            progress_service.set_error(processing_id, result.get("error", "Unknown error"))
            
    except Exception as e:
        logger.error(f"Background processing error: {e}")
        progress_service.set_error(processing_id, str(e))
    finally:
        # Clean up progress after 5 minutes
        import threading
        timer = threading.Timer(300, lambda: progress_service.cleanup_progress(processing_id))
        timer.start()
@app.post("/api/upload", response_model=dict)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload and process a document (PDF or DOCX) with progress tracking
    """
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.docx'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique processing ID
        processing_id = str(uuid.uuid4())
        file_id = Path(file.filename).stem
        upload_path = Path("data/uploads") / file.filename
        
        # Save uploaded file
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File uploaded: {file.filename}")
        
        # Start background processing
        background_tasks.add_task(process_document_async, upload_path, file_id, processing_id)
        
        return {
            "success": True,
            "message": f"Document '{file.filename}' upload started",
            "file_id": file_id,
            "progress_id": processing_id,
            "status_url": f"/api/processing-status/{processing_id}"
        }
            
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    General chat endpoint for conversational AI without documents
    """
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if not mistral_llm.is_ready():
            raise HTTPException(status_code=503, detail="Model not loaded yet. Please wait.")
        
        # Generate response using the LLM service directly
        response_text = mistral_llm.generate_response(
            prompt=request.message,
            max_tokens=256,
            temperature=0.7
        )
        
        return ChatResponse(
            success=True,
            response=response_text,
            model_info={
                "model_name": getattr(mistral_llm, "model_name", "unknown"),
                "tokens_used": len(response_text.split()),  # Approximate token count
                "context_length": mistral_llm.n_ctx
            }
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            success=False,
            error=str(e)
        )

@app.post("/api/question", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a question about uploaded documents
    """
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Get answer from Q&A service
        result = qa_service.answer_question(
            question=request.question,
            file_id=request.file_id
        )
        
        if result["success"]:
            return QuestionResponse(
                success=True,
                answer=result["answer"],
                sources=result["sources"],
                chunks_used=result["chunks_used"]
            )
        else:
            return QuestionResponse(
                success=False,
                error=result["error"]
            )
            
    except Exception as e:
        logger.error(f"Question error: {e}")
        return QuestionResponse(
            success=False,
            error=str(e)
        )

@app.get("/api/documents")
async def list_documents():
    """
    List all processed documents
    """
    try:
        documents = qa_service.list_documents()
        return {
            "success": True,
            "documents": documents,
            "count": len(documents)
        }
    except Exception as e:
        logger.error(f"List documents error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{file_id}")
async def get_document_info(file_id: str):
    """
    Get information about a specific document
    """
    try:
        doc_info = qa_service.get_document_info(file_id)
        if doc_info:
            return {
                "success": True,
                "document": doc_info
            }
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        logger.error(f"Get document info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model/status")
async def model_status():
    """
    Check LLM model status
    """
    return {
        "model_loaded": mistral_llm.is_ready(),
        "model_path": mistral_llm.model_path,
        "context_size": mistral_llm.n_ctx,
        "model_name": getattr(mistral_llm, "model_name", "unknown")
    }

@app.delete("/api/documents/{file_id}")
async def delete_document(file_id: str):
    """
    Delete a processed document
    """
    try:
        # Remove from memory
        if file_id in qa_service.document_chunks:
            del qa_service.document_chunks[file_id]
        if file_id in qa_service.document_metadata:
            del qa_service.document_metadata[file_id]
        
        # Remove processed file
        processed_file = Path("data/processed") / f"{file_id}.json"
        if processed_file.exists():
            processed_file.unlink()
        
        return {
            "success": True,
            "message": f"Document '{file_id}' deleted successfully"
        }
    except Exception as e:
        logger.error(f"Delete document error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
