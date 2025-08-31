from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
import uvicorn
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import engine, Base
from routers import auth, attendance, courses, users
from websocket_manager import ConnectionManager

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# WebSocket connection manager
manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Attendance System...")
    yield
    # Shutdown
    print("Shutting down Attendance System...")

# Create FastAPI app
app = FastAPI(
    title="College Attendance System",
    description="Real-time attendance tracking system for colleges",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.isdir(static_dir):
    os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Favicon handler to avoid 404s
@app.get("/favicon.ico")
async def favicon():
    logo_path = os.path.join(static_dir, "kcea_logo.png")
    if os.path.isfile(logo_path):
        return FileResponse(logo_path)
    # Fallback to official site icon
    return RedirectResponse(url="https://kcea.in/wp-content/uploads/2024/05/cropped-kcea-logo-1-192x192.png")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(users.router, prefix="/users", tags=["Users"])

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast message to all connected clients
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"message": "College Attendance System API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "attendance-system"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 