from fastapi import APIRouter, Request

from app.core.dependencies import CurrentUser, DbSession, AuditService
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, status_code=200)
async def login(
    body: LoginRequest,
    request: Request,
    db: DbSession,
) -> TokenResponse:
    service = AuthService(db)
    result = await service.authenticate(body.username, body.password, request)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type=result["token_type"],
        expires_in=result["expires_in"],
    )


@router.post("/refresh", response_model=TokenResponse, status_code=200)
async def refresh(
    body: RefreshTokenRequest,
    request: Request,
    db: DbSession,
) -> TokenResponse:
    service = AuthService(db)
    result = await service.refresh_token(body.refresh_token, request)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type=result["token_type"],
        expires_in=result["expires_in"],
    )


@router.post("/logout", response_model=MessageResponse, status_code=200)
async def logout(
    current_user: CurrentUser,
    request: Request,
    audit: AuditService,
) -> MessageResponse:
    await audit.log_logout(current_user.id, request)
    return MessageResponse(success=True, message="Logged out successfully")


@router.post("/change-password", response_model=MessageResponse, status_code=200)
async def change_password(
    body: ChangePasswordRequest,
    current_user: CurrentUser,
    request: Request,
    db: DbSession,
) -> MessageResponse:
    service = AuthService(db)
    await service.change_password(current_user.id, body.old_password, body.new_password, request)
    return MessageResponse(success=True, message="Password changed successfully")
