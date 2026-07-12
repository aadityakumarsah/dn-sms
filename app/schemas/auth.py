from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, description="Username or email")
    password: str = Field(..., min_length=1, max_length=128, description="Password")


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str = "access"
    role: str | None = None
    permissions: list[str] | None = None
