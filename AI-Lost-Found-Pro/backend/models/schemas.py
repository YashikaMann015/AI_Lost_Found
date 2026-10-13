from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

class ReportCreate(BaseModel):
    report_type: str = Field(pattern="^(lost|found)$")
    title: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=60)
    description: str = Field(min_length=5, max_length=2000)
    location: str = Field(min_length=2, max_length=160)
    date: str
    time: Optional[str] = ""
    image_url: Optional[str] = ""

class DecisionRequest(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    admin_note: Optional[str] = Field(default="", max_length=500)
