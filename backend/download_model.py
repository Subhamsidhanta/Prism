#!/usr/bin/env python3
"""
Download a working model for testing
"""
import os
import requests
from pathlib import Path
import sys

def download_model():
    """Download a small, known-working model for testing"""
    
    # URLs for small, reliable models (these are just examples - you might need to adjust)
    models = [
        {
            "name": "Phi-3-mini-4k-instruct-q4.gguf",
            "url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
            "size": "~2.4GB"
        }
    ]
    
    print("Available models for download:")
    for i, model in enumerate(models):
        print(f"{i+1}. {model['name']} ({model['size']})")
    
    print("\nFor now, let's try to fix the current model or use model discovery...")
    
    # Check if we can find any working models
    model_dir = Path("../models/llm")
    print(f"\nChecking models in: {model_dir.absolute()}")
    
    if model_dir.exists():
        for file in model_dir.glob("*.gguf"):
            print(f"Found model: {file.name}")
            print(f"Size: {file.stat().st_size / (1024*1024*1024):.2f} GB")

if __name__ == "__main__":
    download_model()