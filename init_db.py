#!/usr/bin/env python3
"""
Database initialization script for the College Attendance System
"""

import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import engine, Base, SessionLocal, User, Course
from routers.auth import get_password_hash

# Set environment variables
os.environ["SECRET_KEY"] = "your-super-secret-key-change-this-in-production"
os.environ["DATABASE_URL"] = "sqlite:///./attendance.db"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

def init_db():
    """Initialize the database with tables and sample data"""
    print("Recreating database tables (drop + create)...")
    try:
        Base.metadata.drop_all(bind=engine)
    except Exception as e:
        print(f"Warning dropping tables: {e}")
    Base.metadata.create_all(bind=engine)
    
    print("Creating sample users...")
    db = SessionLocal()
    
    try:
        # Create admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@college.edu",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin_user)
            print("Created admin user: admin/admin123")
        
        # Create teacher user
        teacher_user = db.query(User).filter(User.username == "teacher").first()
        if not teacher_user:
            teacher_user = User(
                username="teacher",
                email="teacher@college.edu",
                full_name="John Doe",
                hashed_password=get_password_hash("teacher123"),
                role="teacher"
            )
            db.add(teacher_user)
            print("Created teacher user: teacher/teacher123")
        
        # Create student user
        student_user = db.query(User).filter(User.username == "student").first()
        if not student_user:
            student_user = User(
                username="student",
                email="student@college.edu",
                full_name="Jane Smith",
                hashed_password=get_password_hash("student123"),
                role="student"
            )
            db.add(student_user)
            print("Created student user: student/student123")
        
        db.commit()
        
        # Create sample course
        course = db.query(Course).filter(Course.code == "CS101").first()
        if not course:
            course = Course(
                code="CS101",
                name="Introduction to Computer Science",
                description="Basic concepts of programming and computer science",
                teacher_id=teacher_user.id
            )
            db.add(course)
            print("Created sample course: CS101")
        
        db.commit()
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
