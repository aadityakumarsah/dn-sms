from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    is_active: bool = True
    role_id: int | None = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="Password")


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    is_active: bool | None = None
    role_id: int | None = None


class UserResponse(UserBase):
    id: int
    is_superuser: bool
    created_at: datetime
    updated_at: datetime | None = None
    role_name: str | None = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    success: bool = True
    data: list[UserResponse]
    total: int
