"""
LLM Service for loading a local GGUF model with llama.cpp (optimized for speed)

Enhancements:
- Supports explicit model path via environment variables: LLM_MODEL_PATH or PRISM_LLM_MODEL_PATH
- Discovers any .gguf under common model folders and prefers Gemma, then Mistral
- Keeps prior defaults for performance (n_ctx, n_threads) and templating
"""
import os
from typing import List, Optional
from llama_cpp import Llama
import logging
import threading
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Look for .env file in the services directory and parent directories
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        print(f"Loaded environment variables from: {env_file}")
    else:
        # Try parent directories
        for parent in Path(__file__).parents:
            env_file = parent / ".env"
            if env_file.exists():
                load_dotenv(env_file)
                print(f"Loaded environment variables from: {env_file}")
                break
except ImportError:
    print("python-dotenv not installed, environment variables may not be loaded from .env file")

logger = logging.getLogger(__name__)

class MistralLLM:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Singleton pattern to ensure model loads only once"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, model_path: str = None, n_ctx: int = 2048, n_threads: int = 8):
        """
        Initialize Mistral 7B model using llama.cpp with performance optimizations
        
        Args:
            model_path: Path to the GGUF model file
            n_ctx: Context window size (reduced to 2048 for speed)
            n_threads: Number of threads for inference (increased for speed)
        """
        if hasattr(self, 'initialized'):
            return
            
        # Allow env var overrides first
        env_model_path = os.getenv("LLM_MODEL_PATH") or os.getenv("PRISM_LLM_MODEL_PATH")
        self.model_path = model_path or env_model_path or self._find_model_path()
        self.n_ctx = n_ctx
        self.n_threads = n_threads
        self.llm = None
        self.initialized = True
        
        if self.model_path and os.path.exists(self.model_path):
            self._load_model()
        else:
            logger.warning(
                f"Model not found at {self.model_path}. Set LLM_MODEL_PATH or place a .gguf under models/llm/."
            )

    @property
    def model_name(self) -> str:
        """Best-effort model name from the file path"""
        try:
            if self.model_path:
                return os.path.splitext(os.path.basename(self.model_path))[0]
        except Exception:
            pass
        return "unknown-model"
    
    def _find_model_path(self) -> str:
        """Find a GGUF model file in common locations, preferring Gemma then Mistral."""
        cwd = os.getcwd()
        script_dir = os.path.dirname(os.path.abspath(__file__))

        # Candidate directories to scan for any .gguf
        candidate_dirs = [
            os.path.join(cwd, "models", "llm"),
            os.path.join(os.path.dirname(os.path.dirname(script_dir)), "models", "llm"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(script_dir))), "models", "llm"),
            os.path.abspath(os.path.join(script_dir, "..", "..", "models", "llm")),
            os.path.abspath(os.path.join(script_dir, "..", "..", "..", "models", "llm")),
        ]

        # Unique-ify and keep only existing dirs
        seen = set()
        dirs = []
        for d in candidate_dirs:
            if d and d not in seen:
                seen.add(d)
                if os.path.isdir(d):
                    dirs.append(d)

        ggufs: List[str] = []
        for d in dirs:
            try:
                for name in os.listdir(d):
                    if name.lower().endswith(".gguf"):
                        ggufs.append(os.path.abspath(os.path.join(d, name)))
            except Exception:
                continue

        # Also check a couple of legacy/fallback spots
        for p in [
            os.path.abspath("models/llm"),
            os.path.abspath("../models/llm"),
            os.path.abspath("../../models/llm"),
        ]:
            if os.path.isdir(p):
                try:
                    for name in os.listdir(p):
                        if name.lower().endswith(".gguf"):
                            ggufs.append(os.path.abspath(os.path.join(p, name)))
                except Exception:
                    pass

        # De-duplicate
        ggufs = sorted(set(ggufs))

        if ggufs:
            def score(path: str) -> tuple:
                fname = os.path.basename(path).lower()
                # Prefer gemma, then mistral; prefer higher quant (Q* order roughly)
                family_rank = 0
                if "gemma" in fname:
                    family_rank = 2
                elif "mistral" in fname:
                    family_rank = 1
                else:
                    family_rank = 0

                # Prefer K_M over K_S lightly, and Q6 > Q5 > Q4 > Q3
                quant_rank = 0
                if "q6" in fname:
                    quant_rank = 4
                elif "q5" in fname:
                    quant_rank = 3
                elif "q4" in fname:
                    quant_rank = 2
                elif "q3" in fname:
                    quant_rank = 1
                kv_rank = 1 if "_k_m" in fname else 0
                return (-family_rank, -quant_rank, -kv_rank, fname)

            # Sort by our preference ascending by negatives
            ggufs.sort(key=score)

            # After sorting by score, pick the first
            chosen = ggufs[0]
            logger.info("Discovered GGUF models:")
            for path in ggufs:
                logger.info(f" - {path}")
            logger.info(f"Selected model: {chosen}")
            return chosen

        # Final fallback: point to a typical path under CWD
        default_path = os.path.join(cwd, "models", "llm", "model.gguf")
        logger.warning(
            "No GGUF models found. Place your model under models/llm/ or set LLM_MODEL_PATH. "
            f"Expected default location: {default_path}"
        )
        return default_path
    
    def _load_model(self):
        """Load the model with performance optimizations"""
        try:
            logger.info(f"Loading model from {self.model_path}")
            logger.info(f"Model file exists: {os.path.exists(self.model_path)}")
            logger.info(f"Model file size: {os.path.getsize(self.model_path) / (1024*1024*1024):.2f} GB")
            
            self.llm = Llama(
                model_path=self.model_path,
                n_ctx=self.n_ctx,           # Reduced context for speed
                n_threads=self.n_threads,   # More threads for speed
                n_batch=512,                # Batch processing
                n_gpu_layers=0,             # CPU only for stability
                use_mmap=True,              # Memory mapping for faster loading
                use_mlock=False,            # Don't lock all memory
                verbose=True,               # Enable verbose for debugging
                f16_kv=True,                # Use half precision for KV cache
                logits_all=False,           # Don't compute logits for all tokens
            )
            logger.info("✅ Model loaded successfully with performance optimizations")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            self.llm = None
    
    def is_ready(self) -> bool:
        """Check if the model is loaded and ready"""
        return self.llm is not None
    
    def generate_response(self, prompt: str, max_tokens: int = 256, temperature: float = 0.4) -> str:
        """
        Generate response from the model with speed optimizations
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate (increased for complete responses)
            temperature: Sampling temperature (lower for faster, more focused responses)
            
        Returns:
            Generated response text
        """
        if not self.is_ready():
            return "Error: Model not loaded. Please check if the model file exists."
        
        try:
            # Choose a simple template; prefer Gemma chat format if detected
            formatted_prompt = self._format_prompt(prompt)
            
            # Optimized generation parameters for balanced speed and completeness
            response = self.llm(
                formatted_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,                 # Slightly higher for better completeness
                top_k=50,                   # Increase vocabulary for better responses
                repeat_penalty=1.15,        # Stronger penalty to avoid repetition
                stop=["[/INST]", "[INST]", "</s>"],  # Remove \n\n stop to allow complete responses
                echo=False,
                stream=False
            )
            
            return response["choices"][0]["text"].strip()
        
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"

    def _format_prompt(self, prompt: str) -> str:
        """Return a model-friendly prompt format based on detected model name."""
        name = (self.model_name or "").lower()
        if "gemma" in name:
            # Gemma chat template (simplified). Many Gemma instruct models in llama.cpp
            # use <start_of_turn>/<end_of_turn> markers.
            return (
                f"<start_of_turn>user\n{prompt}<end_of_turn>\n"
                f"<start_of_turn>model\n"
            )
        # Default to LLaMA/Mistral-style instruction format
        return f"[INST] {prompt} [/INST]"
    
    def answer_question(self, context: str, question: str) -> str:
        """
        Answer a question based on provided context with optimizations
        
        Args:
            context: Document text context (increased limit for complete responses)
            question: User question
            
        Returns:
            Answer based on the context
        """
        # Increase context length limit for better responses
        max_context_length = 3000
        if len(context) > max_context_length:
            context = context[:max_context_length] + "..."
        
        prompt = f"""Answer the question based on the context below. Provide a complete and comprehensive answer with all relevant details. Do not stop mid-sentence.

Context: {context}

Question: {question}

Answer:"""
        
        return self.generate_response(prompt, max_tokens=400, temperature=0.2)

# Global instance
mistral_llm = MistralLLM()