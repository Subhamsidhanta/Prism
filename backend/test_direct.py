#!/usr/bin/env python3
"""
Simple model test without the service layer
"""
import os
from pathlib import Path

def test_direct_model_loading():
    """Test loading the model directly with llama-cpp-python"""
    
    print("=== Direct Model Loading Test ===")
    
    # Test model path
    model_path = "D:/vs/Subham/projects/prism/p2/Prism/models/llm/gemma-3n-E4B-it-UD-Q2_K_XL.gguf"
    print(f"Model path: {model_path}")
    print(f"Model exists: {Path(model_path).exists()}")
    
    try:
        from llama_cpp import Llama
        print(f"llama-cpp-python imported successfully")
        
        print("Attempting to load model with minimal settings...")
        
        # Try with very basic settings first
        llm = Llama(
            model_path=model_path,
            n_ctx=512,        # Smaller context
            n_threads=4,      # Fewer threads
            verbose=True,     # Enable debug output
            use_mmap=True,    # Use memory mapping
            n_gpu_layers=0,   # CPU only
        )
        
        print("✅ Model loaded successfully!")
        
        # Test a simple generation
        print("Testing generation...")
        result = llm("Hello", max_tokens=10, echo=False)
        print(f"Generation result: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_direct_model_loading()