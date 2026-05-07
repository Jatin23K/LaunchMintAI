
import sys
import os
sys.path.append(os.getcwd())
print(f"CWD: {os.getcwd()}")
try:
    from app.main import app
    print("Import success")
except Exception as e:
    import traceback
    traceback.print_exc()
