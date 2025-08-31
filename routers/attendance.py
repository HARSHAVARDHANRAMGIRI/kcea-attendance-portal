from fastapi import APIRouter, Depends, HTTPException, status, WebSocket
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional
import qrcode
import io
import base64
import uuid

from database import get_db, User, Course, Session as DBSession, Attendance, Enrollment
from routers.auth import get_current_active_user
from websocket_manager import ConnectionManager
from sqlalchemy import func, and_

router = APIRouter()
manager = ConnectionManager()

# Pydantic models
class SessionCreate(BaseModel):
    course_id: int
    date: datetime
    start_time: datetime
    end_time: datetime

class AttendanceMark(BaseModel):
    session_id: int
    method: str = "qr"
    status: str = "present"

class SessionResponse(BaseModel):
    id: int
    course_id: int
    date: datetime
    start_time: datetime
    end_time: datetime
    qr_code: str
    is_active: bool

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    session_id: int
    marked_at: datetime
    method: str
    status: str

class AttendanceSheetRow(BaseModel):
    roll_number: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    class_name: Optional[str] = None
    date: datetime
    status: str

class AdminAttendanceRow(BaseModel):
    id: int
    roll_number: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    class_name: Optional[str] = None
    course_id: Optional[int] = None
    session_id: Optional[int] = None
    date: datetime
    status: str

# Routes
@router.post("/sessions/create", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a teacher
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can create sessions"
        )
    
    # Check if course exists and user is teaching it
    course = db.query(Course).filter(Course.id == session_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only create sessions for courses you teach"
        )
    
    # Generate unique QR code
    qr_code = str(uuid.uuid4())
    
    # Create session
    db_session = DBSession(
        course_id=session_data.course_id,
        date=session_data.date,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        qr_code=qr_code
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Broadcast session start
    await manager.broadcast_session_start(
        course_id=session_data.course_id,
        session_id=db_session.id,
        qr_code=qr_code
    )
    
    return db_session

@router.get("/sessions/{course_id}", response_model=List[SessionResponse])
async def get_course_sessions(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user has access to this course
    if current_user.role == "teacher":
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.teacher_id == current_user.id
        ).first()
    else:
        # Check if student is enrolled
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this course"
            )
    
    sessions = db.query(DBSession).filter(
        DBSession.course_id == course_id
    ).order_by(DBSession.date.desc()).all()
    
    return sessions

@router.post("/mark", response_model=AttendanceResponse)
async def mark_attendance(
    attendance_data: AttendanceMark,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a student
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can mark attendance"
        )
    
    # Check if session exists and is active
    session = db.query(DBSession).filter(
        DBSession.id == attendance_data.session_id,
        DBSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or inactive")
    
    # Check if student is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == session.course_id,
        Enrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course"
        )
    
    # Check if attendance already marked
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == current_user.id,
        Attendance.session_id == attendance_data.session_id
    ).first()
    
    if existing_attendance:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this session"
        )
    
    # Mark attendance
    attendance = Attendance(
        student_id=current_user.id,
        session_id=attendance_data.session_id,
        method=attendance_data.method,
        status=attendance_data.status
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    # Broadcast attendance update
    student_count = db.query(Attendance).filter(
        Attendance.session_id == attendance_data.session_id
    ).count()
    
    await manager.broadcast_attendance_update(
        course_id=session.course_id,
        session_id=attendance_data.session_id,
        student_count=student_count
    )
    
    return attendance

@router.get("/sessions/{session_id}/qr")
async def get_session_qr(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a teacher
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can access QR codes"
        )
    
    # Get session
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is teaching this course
    course = db.query(Course).filter(Course.id == session.course_id).first()
    if course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only access QR codes for your courses"
        )
    
    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(session.qr_code)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "qr_code": session.qr_code,
        "qr_image": f"data:image/png;base64,{qr_base64}",
        "session_info": {
            "id": session.id,
            "course_id": session.course_id,
            "date": session.date,
            "start_time": session.start_time,
            "end_time": session.end_time
        }
    }

@router.get("/sessions/{session_id}/attendance", response_model=List[AttendanceResponse])
async def get_session_attendance(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get session
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check access permissions
    if current_user.role == "teacher":
        course = db.query(Course).filter(Course.id == session.course_id).first()
        if course.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view attendance for your courses"
            )
    else:
        # Check if student is enrolled
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == session.course_id,
            Enrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this course"
            )
    
    attendance_records = db.query(Attendance).filter(
        Attendance.session_id == session_id
    ).all()
    
    return attendance_records

@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a teacher
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can end sessions"
        )
    
    # Get session
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user is teaching this course
    course = db.query(Course).filter(Course.id == session.course_id).first()
    if course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only end sessions for your courses"
        )
    
    # End session
    session.is_active = False
    db.commit()
    
    # Broadcast session end
    await manager.broadcast_session_end(
        course_id=session.course_id,
        session_id=session_id
    )
    
    return {"message": "Session ended successfully"} 

@router.get("/sheet/{course_id}", response_model=List[AttendanceSheetRow])
async def get_attendance_sheet(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Teachers can see their course; students can see only their own entries
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    query = db.query(
        Attendance.status,
        Attendance.marked_at.label("date"),
        User.roll_number,
        User.full_name,
        User.department,
        User.class_name,
    ).join(User, User.id == Attendance.student_id).join(DBSession, DBSession.id == Attendance.session_id).filter(DBSession.course_id == course_id)

    if current_user.role == "student":
        query = query.filter(Attendance.student_id == current_user.id)

    rows = query.order_by(Attendance.marked_at.desc()).all()
    return [
        AttendanceSheetRow(
            roll_number=r.roll_number,
            full_name=r.full_name,
            department=r.department,
            class_name=r.class_name,
            date=r.date,
            status=r.status,
        ) for r in rows
    ]

# Admin endpoints: list and export with filters
@router.get("/admin/list", response_model=List[AdminAttendanceRow])
async def admin_list_attendance(
    date: Optional[str] = None,
    student_id: Optional[int] = None,
    roll_number: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Only admins and teachers can access
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Only admins/teachers can view attendance")

    query = db.query(
        Attendance.id,
        Attendance.status,
        Attendance.marked_at.label("date"),
        User.roll_number,
        User.full_name,
        User.department,
        User.class_name,
        DBSession.course_id,
        Attendance.session_id,
    ).join(User, User.id == Attendance.student_id).join(DBSession, DBSession.id == Attendance.session_id)

    # Teacher sees only their courses
    if current_user.role == "teacher":
        query = query.join(Course, Course.id == DBSession.course_id).filter(Course.teacher_id == current_user.id)

    if student_id is not None:
        query = query.filter(Attendance.student_id == student_id)
    if roll_number:
        query = query.filter(User.roll_number == roll_number)
    if date:
        # Expecting YYYY-MM-DD; filter records on that calendar date
        try:
            day = datetime.strptime(date, "%Y-%m-%d").date()
            next_day = day.replace(day=day.day)  # placeholder to keep variable
            # Compare by date part of marked_at
            query = query.filter(func.date(Attendance.marked_at) == str(day))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    query = query.order_by(Attendance.marked_at.desc())
    results = query.all()

    return [
        AdminAttendanceRow(
            id=r.id,
            roll_number=r.roll_number,
            full_name=r.full_name,
            department=r.department,
            class_name=r.class_name,
            course_id=r.course_id,
            session_id=r.session_id,
            date=r.date,
            status=r.status,
        )
        for r in results
    ]

@router.get("/admin/export", response_class=PlainTextResponse)
async def admin_export_attendance(
    date: Optional[str] = None,
    student_id: Optional[int] = None,
    roll_number: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Reuse list endpoint logic
    rows = await admin_list_attendance(date=date, student_id=student_id, roll_number=roll_number, db=db, current_user=current_user)

    # Build CSV
    headers = ["id", "roll_number", "full_name", "department", "class", "course_id", "session_id", "date", "status"]
    out_lines = [",".join(headers)]
    for r in rows:
        out_lines.append(
            f"{r.id},{r.roll_number or ''},{r.full_name or ''},{r.department or ''},{r.class_name or ''},{r.course_id or ''},{r.session_id or ''},{r.date.isoformat()},{r.status}"
        )
    csv_text = "\n".join(out_lines)
    return PlainTextResponse(content=csv_text, media_type="text/csv")