from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db, User
from routers.auth import get_current_active_user
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary via CLOUDINARY_URL or explicit keys
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

router = APIRouter()

# Pydantic models
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    roll_number: Optional[str] = None
    department: Optional[str] = None
    program: Optional[str] = None
    class_name: Optional[str] = None
    photo_path: Optional[str] = None
    id_card_path: Optional[str] = None

# Routes
@router.get("/", response_model=List[UserResponse])
async def get_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only admins can see all users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view all users"
        )
    
    users = db.query(User).all()
    return users

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Update user fields
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    
    if user_data.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(
            User.email == user_data.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already taken"
            )
        current_user.email = user_data.email
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Users can only see their own profile, admins can see all
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own profile"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only admins can deactivate users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can deactivate users"
        )
    
    # Users cannot deactivate themselves
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated successfully"}

@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only admins can activate users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can activate users"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    db.commit()
    
    return {"message": "User activated successfully"}

@router.post("/me/upload-photo")
async def upload_photo(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
):
    # Upload to Cloudinary
    content = await file.read()
    upload_result = cloudinary.uploader.upload(
        content,
        folder="kcea/users/photos",
        public_id=f"photo_{current_user.id}",
        overwrite=True,
        resource_type="image",
    )
    current_user.photo_path = upload_result.get("secure_url")
    db.commit()
    return {"message": "Photo uploaded", "url": current_user.photo_path}

@router.post("/me/upload-idcard")
async def upload_idcard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
):
    content = await file.read()
    upload_result = cloudinary.uploader.upload(
        content,
        folder="kcea/users/idcards",
        public_id=f"idcard_{current_user.id}",
        overwrite=True,
        resource_type="image",
    )
    current_user.id_card_path = upload_result.get("secure_url")
    db.commit()
    return {"message": "ID card uploaded", "url": current_user.id_card_path}
