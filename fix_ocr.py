import os

# The CORRECT content that handles Text files AND fixes the PaddleOCR crash
CORRECT_CODE = r'''import logging
import os
# Suppress PaddleOCR's noisy debug logs via standard logging
logging.getLogger("ppocr").setLevel(logging.ERROR)

from paddleocr import PaddleOCR
from pypdf import PdfReader

class OCREngine:
    def __init__(self):
        # Initialize OCR once
        print("👁️ [OCR] Loading Neural Engine...")
        # We disable angle classification globally to prevent the 'cls' argument bug
        self.ocr_model = PaddleOCR(use_angle_cls=False, lang='en')

    def extract_text(self, file_path: str) -> str:
        print(f"👁️ [OCR] Processing: {file_path}")
        text = ""

        # ==============================================================================
        # 🚨 STRATEGY 1: PLAIN TEXT BYPASS (CRITICAL FIX)
        # ==============================================================================
        if file_path.endswith(".txt") or file_path.endswith(".md"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception as e:
                print(f"⚠️ Text read failed: {e}")
        # ==============================================================================

        # --- STRATEGY 2: NATIVE PDF EXTRACTION ---
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception:
            pass 

        # --- STRATEGY 3: NEURAL OCR (Fallback for Scans/Images) ---
        if len(text.strip()) < 50:
            print("👁️ [OCR] Native text failed. Running Neural OCR (Paddle)...")
            try:
                # FIX: Call without arguments. The __init__ setting handles the config.
                result = self.ocr_model.ocr(file_path)
                
                text = ""
                if result and result[0]:
                    for line in result[0]:
                        text += line[1][0] + "\n"
            except Exception as e:
                print(f"❌ [OCR Failed] {e}")
                return ""
        
        return text.strip()

# Global Instance
ocr_runner = OCREngine()
'''

# Path to the file we need to overwrite
target_path = os.path.join("backend", "app", "services", "ocr_engine.py")

# Write the file
try:
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(CORRECT_CODE)
    print(f"✅ SUCCESS: Overwrote {target_path} with the correct code.")
except Exception as e:
    print(f"❌ FAIL: Could not write file. Error: {e}")