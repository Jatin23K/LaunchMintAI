import os
import pkgutil
import importlib
import sys

# Ensure we can import from 'app'
sys.path.append(os.getcwd())

print("🔍 STARTING EXTENSION DIAGNOSTIC...")
print(f"📂 Looking in: {os.path.join(os.getcwd(), 'app', 'extensions')}")

success_count = 0
fail_count = 0

extensions_path = os.path.join(os.getcwd(), "app", "extensions")

for _, name, _ in pkgutil.iter_modules([extensions_path]):
    try:
        print(f"\n👉 Attempting to load: {name}...")
        module = importlib.import_module(f"app.extensions.{name}.extension")
        print(f"   ✅ SUCCESS: {name} imported.")
        success_count += 1
    except Exception as e:
        print(f"   ❌ FAILED: {name}")
        print(f"   🧨 ERROR: {str(e)}")
        fail_count += 1

print("\n" + "="*40)
print(f"📊 REPORT: {success_count} Passed | {fail_count} Failed")
print("="*40)

if fail_count > 0:
    print("💡 HINT: If many failed with 'No module named...', you are missing a library.")
    print("💡 HINT: If they failed with 'dotenv', run: pip install python-dotenv")