from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db, User, Course, Enrollment
from routers.auth import get_current_active_user

router = APIRouter()

# Pydantic models
class CourseCreate(BaseModel):
    code: str
    name: str
    description: str

class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    description: str
    teacher_id: int
    is_active: bool

class EnrollmentCreate(BaseModel):
    course_id: int

# Routes
@router.post("/create", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a teacher or admin
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only teachers and admins can create courses"
        )
    
    # Check if course code already exists
    existing_course = db.query(Course).filter(Course.code == course_data.code).first()
    if existing_course:
        raise HTTPException(
            status_code=400,
            detail="Course code already exists"
        )
    
    # Create course
    db_course = Course(
        code=course_data.code,
        name=course_data.name,
        description=course_data.description,
        teacher_id=current_user.id if current_user.role == "teacher" else None
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    return db_course

@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "teacher":
        # Teachers see only their courses
        courses = db.query(Course).filter(
            Course.teacher_id == current_user.id
        ).all()
    elif current_user.role == "student":
        # Students see courses they're enrolled in
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id
        ).all()
        course_ids = [enrollment.course_id for enrollment in enrollments]
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    else:
        # Admins see all courses
        courses = db.query(Course).all()
    
    return courses

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check access permissions
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this course"
        )
    elif current_user.role == "student":
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=403,
                detail="You are not enrolled in this course"
            )
    
    return course

@router.post("/{course_id}/enroll")
async def enroll_student(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a student
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can enroll in courses"
        )
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == current_user.id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=400,
            detail="Already enrolled in this course"
        )
    
    # Create enrollment
    enrollment = Enrollment(
        course_id=course_id,
        student_id=current_user.id
    )
    
    db.add(enrollment)
    db.commit()
    
    return {"message": "Successfully enrolled in course"}

@router.delete("/{course_id}/unenroll")
async def unenroll_student(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is a student
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can unenroll from courses"
        )
    
    # Find and remove enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Not enrolled in this course"
        )
    
    db.delete(enrollment)
    db.commit()
    
    return {"message": "Successfully unenrolled from course"}
