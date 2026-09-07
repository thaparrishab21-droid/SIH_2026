"""
Main Entry Point & Compatibility Forwarder for Flood-Flash FastAPI Backend.
Delegates execution to `backend.app.main:app` or `app.main:app`.
Supports:
  - uvicorn backend.main:app --reload (from project root)
  - uvicorn main:app --reload (from backend directory)
  - python -m uvicorn backend.main:app --reload (from anywhere)
"""
import sys
import os

# Ensure both project root and backend directory are in sys.path
file_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(file_dir)

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if file_dir not in sys.path:
    sys.path.insert(0, file_dir)

try:
    from backend.app.main import app, settings
except ImportError:
    from app.main import app, settings

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
