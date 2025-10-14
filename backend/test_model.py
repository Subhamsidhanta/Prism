#!/usr/bin/env python3
"""
Test script to check LLM model loading
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_model_loading():
    """Test if the model can be loaded successfully"""
    
    print("=== Testing LLM Model Loading ===")
    print(f"Current directory: {os.getcwd()}")
    print(f"Backend directory: {backend_dir}")
    
    # Check environment variables
    print("\n=== Environment Variables ===")
    print(f"LLM_MODEL_PATH: {os.getenv('LLM_MODEL_PATH')}")
    print(f"PRISM_LLM_MODEL_PATH: {os.getenv('PRISM_LLM_MODEL_PATH')}")
    
    # Check if model file exists
    print("\n=== Model File Check ===")
    model_path = Path("../models/llm/gemma-3n-E4B-it-UD-Q2_K_XL.gguf")
    abs_model_path = model_path.resolve()
    print(f"Expected model path: {abs_model_path}")
    print(f"Model file exists: {abs_model_path.exists()}")
    
    if abs_model_path.exists():
        print(f"Model file size: {abs_model_path.stat().st_size / (1024*1024*1024):.2f} GB")
    
    # Test importing LLM service
    print("\n=== LLM Service Import ===")
    try:
        from app.services.llm_service import mistral_llm
        print("✅ LLM service imported successfully")
        
        print(f"Model path detected: {mistral_llm.model_path}")
        print(f"Model ready: {mistral_llm.is_ready()}")
        print(f"Model name: {getattr(mistral_llm, 'model_name', 'unknown')}")
        
        if mistral_llm.is_ready():
            print("\n=== Testing Model Response ===")
            try:
                response = mistral_llm.generate_response("Hello, can you hear me?", max_tokens=50)
                print(f"Model response: {response}")
                print("✅ Model test successful!")
            except Exception as e:
                print(f"❌ Model test failed: {e}")
        else:
            print("❌ Model not ready")
            
    except Exception as e:
        print(f"❌ Error importing LLM service: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_model_loading()