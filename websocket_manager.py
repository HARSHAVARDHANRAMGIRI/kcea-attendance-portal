from fastapi import WebSocket
from typing import List
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove broken connections
                self.active_connections.remove(connection)

    async def broadcast_json(self, data: dict):
        message = json.dumps(data)
        await self.broadcast(message)

    async def broadcast_attendance_update(self, course_id: int, session_id: int, student_count: int):
        """Broadcast attendance updates to all connected clients"""
        update_data = {
            "type": "attendance_update",
            "course_id": course_id,
            "session_id": session_id,
            "student_count": student_count,
            "timestamp": str(datetime.now())
        }
        await self.broadcast_json(update_data)

    async def broadcast_session_start(self, course_id: int, session_id: int, qr_code: str):
        """Broadcast when a new session starts"""
        start_data = {
            "type": "session_start",
            "course_id": course_id,
            "session_id": session_id,
            "qr_code": qr_code,
            "timestamp": str(datetime.now())
        }
        await self.broadcast_json(start_data)

    async def broadcast_session_end(self, course_id: int, session_id: int):
        """Broadcast when a session ends"""
        end_data = {
            "type": "session_end",
            "course_id": course_id,
            "session_id": session_id,
            "timestamp": str(datetime.now())
        }
        await self.broadcast_json(end_data) 