from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional

from database import get_db, User, OTP
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str
    roll_number: str
    department: str
    program: str
    class_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    username: Optional[str] = None

class OTPRequest(BaseModel):
    username: Optional[str] = None
    roll_number: Optional[str] = None
    purpose: str = "login"  # or "signup"

class OTPVerify(BaseModel):
    username: Optional[str] = None
    roll_number: Optional[str] = None
    code: str
    purpose: str = "login"

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_otp_code() -> str:
    from random import randint
    return f"{randint(100000, 999999)}"

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Routes
@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role,
        roll_number=user_data.roll_number,
        department=user_data.department,
        program=user_data.program,
        class_name=user_data.class_name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "message": "User registered successfully",
        "user_id": db_user.id,
        "username": db_user.username
    }

@router.post("/request-otp", response_model=dict)
async def request_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    # Find user by username or roll number
    query = db.query(User)
    if payload.username:
        user = query.filter(User.username == payload.username).first()
    elif payload.roll_number:
        user = query.filter(User.roll_number == payload.roll_number).first()
    else:
        raise HTTPException(status_code=400, detail="username or roll_number required")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    code = generate_otp_code()
    expires = datetime.utcnow() + timedelta(minutes=5)
    otp = OTP(username=user.username, code=code, purpose=payload.purpose, expires_at=expires)
    db.add(otp)
    db.commit()

    # In production, send via SMS/Email. Here we return it for demo/testing.
    return {"message": "OTP generated", "otp": code, "expires_in_minutes": 5}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    # Resolve user
    query = db.query(User)
    if payload.username:
        user = query.filter(User.username == payload.username).first()
    elif payload.roll_number:
        user = query.filter(User.roll_number == payload.roll_number).first()
    else:
        raise HTTPException(status_code=400, detail="username or roll_number required")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate OTP
    otp = db.query(OTP).filter(
        OTP.username == user.username,
        OTP.code == payload.code,
        OTP.purpose == payload.purpose
    ).order_by(OTP.created_at.desc()).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/me", response_model=dict)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active
    } 