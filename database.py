from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variable or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./attendance.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if isinstance(DATABASE_URL, str) and DATABASE_URL.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String)  # "student", "teacher", "admin"
    is_active = Column(Boolean, default=True)
    # College specific fields
    roll_number = Column(String, unique=True, index=True)  # e.g., 22B41A0501
    department = Column(String)  # CSE, CSE(DS), MECH, CIVIL, ECE, EEE
    program = Column(String)  # B.Tech, etc.
    class_name = Column(String)  # Section/Batch like B4
    photo_path = Column(String)  # stored path to uploaded profile photo
    id_card_path = Column(String)  # stored path to uploaded ID card image
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    courses_teaching = relationship("Course", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")

class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)  # username or roll_number used for login
    code = Column(String)
    purpose = Column(String)  # "login" | "signup"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(Text)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    teacher = relationship("User", back_populates="courses_teaching")
    enrollments = relationship("Enrollment", back_populates="course")
    sessions = relationship("Session", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    date = Column(DateTime)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    qr_code = Column(String, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="sessions")
    attendance_records = relationship("Attendance", back_populates="session")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("sessions.id"))
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    method = Column(String)  # "qr", "manual", "biometric"
    status = Column(String)  # "present", "late", "absent"
    
    # Relationships
    student = relationship("User", back_populates="attendance_records")
    session = relationship("Session", back_populates="attendance_records")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 