import os
import sys
import subprocess
import time

def run():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    print("========================================================")
    print("  Starting Flood-Flash Predictive Early Warning System  ")
    print("========================================================")

    print("\n1. Seeding Database...")
    seed_proc = subprocess.run([sys.executable, "-m", "backend.seed_data"], cwd=root_dir)
    if seed_proc.returncode != 0:
        print("⚠️ Warning: Database seed returned non-zero code.")

    print("\n2. Launching FastAPI Backend Server (http://localhost:8000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--port", "8000", "--reload"],
        cwd=root_dir
    )

    print("\n3. Launching Vite Frontend Dev Server (http://localhost:5173)...")
    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True
    )

    print("\n========================================================")
    print("  Both services are running!")
    print("  - Frontend UI:     http://localhost:5173")
    print("  - Backend API:      http://localhost:8000")
    print("  - API Docs:         http://localhost:8000/docs")
    print("  Press Ctrl+C at any time to stop both servers.")
    print("========================================================\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Servers stopped cleanly.")

if __name__ == "__main__":
    run()
