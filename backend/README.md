# Prism Backend API

The FastAPI backend for the Prism multimodal RAG system with document Q&A capabilities using local GGUF models (Gemma, Mistral, etc.).

## Quick Start

### 1. Setup Development Environment

```bash
# Install dependencies
pip install -r requirements.txt

# Or use the setup script
python setup_dev.py
```

### 2. Download an LLM Model (GGUF)

Place any `.gguf` model file under `models/llm/` (e.g., Gemma or Mistral). The loader will auto-discover and prefer Gemma files.

Examples:
- `models/llm/gemma-3n-E4B-it-Q3_K_S.gguf`
- `models/llm/mistral-7b-instruct-v0.2.Q4_K_M.gguf`

You can also set an explicit path via environment variable:

Windows (PowerShell):
```
$env:LLM_MODEL_PATH = "E:\\prism\\Prism\\backend\\models\\llm\\gemma-3n-E4B-it-Q3_K_S.gguf"
```
or
```
$env:PRISM_LLM_MODEL_PATH = "E:\\prism\\Prism\\backend\\models\\llm\\gemma-3n-E4B-it-Q3_K_S.gguf"
```

### 3. Run the Server

```bash
# Development mode
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the run script
python run_server.py
```

The API will be available at: `http://localhost:8000`
Interactive docs at: `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   └── services/
│       ├── llm_service.py   # Local GGUF LLM integration (Gemma/Mistral)
│       └── qa_service.py    # Document Q&A logic
├── ingestion/
│   ├── parse_pdf.py         # PDF/DOCX parsing
│   └── chunker.py           # Text chunking
├── data/
│   ├── uploads/             # Uploaded files
│   ├── processed/           # Processed documents
│   └── indices/             # Vector indices (future)
└── models/
    └── llm/                 # LLM model files
```

## API Endpoints

### Core Endpoints
- `POST /api/upload` - Upload and process documents
- `POST /api/question` - Ask questions about documents  
- `GET /api/documents` - List processed documents
- `GET /api/documents/{file_id}` - Get document info
- `DELETE /api/documents/{file_id}` - Delete document
- `GET /api/model/status` - Check LLM model status

### Health Check
- `GET /` - API health and status

## Supported File Types
- **Documents**: PDF, DOCX
- **Images**: JPG, PNG, GIF (OCR processing - placeholder)
- **Audio**: MP3, WAV, M4A (transcription - placeholder)

## Troubleshooting

### Common Issues

#### 1. ImportError: No module named 'PyPDF2'
```bash
pip install -r requirements.txt
```

#### 2. llama-cpp-python Installation Issues
```bash
# Force reinstall with no cache
pip install llama-cpp-python --force-reinstall --no-cache-dir
```

If you're on Python 3.12/3.13 or Windows and see load failures or crashes, consider upgrading:
```bash
pip install --upgrade "llama-cpp-python>=0.3.6"
```
Then re-run the backend.

#### 3. Model Not Found Error
- Download the model file to the correct path
- Check permissions on the models directory
- Verify file integrity (model should be ~4GB)

#### 4. Import Path Issues
```bash
export PYTHONPATH="${PYTHONPATH}:/path/to/prism/backend"
```

For more details, see the complete documentation.