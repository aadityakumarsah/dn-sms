from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.repositories.user import UserRepository
from app.services.audit_log import AuditLogService


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.audit_service = AuditLogService(db)

    async def authenticate(self, username: str, password: str, request: Request | None = None) -> dict[str, Any]:
        user = await self.user_repo.get_by_email_or_username(username)
        if not user or not verify_password(password, user.password_hash):
            if user:
                await self.audit_service.log_login(user.id, request, success=False)
            raise UnauthorizedException("Invalid credentials")

        if not user.is_active:
            raise UnauthorizedException("Account is inactive")

        await self.audit_service.log_login(user.id, request, success=True)

        extra_claims: dict[str, Any] = {}
        if user.role:
            extra_claims["role"] = user.role.name
            extra_claims["permissions"] = user.role.permissions or []

        access_token = create_access_token(subject=user.id, extra_claims=extra_claims)
        refresh_token = create_refresh_token(subject=user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def refresh_token(self, refresh_token: str, request: Request | None = None) -> dict[str, Any]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        user = await self.user_repo.get_by_id(int(payload["sub"]))
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        extra_claims: dict[str, Any] = {}
        if user.role:
            extra_claims["role"] = user.role.name
            extra_claims["permissions"] = user.role.permissions or []

        new_access = create_access_token(subject=user.id, extra_claims=extra_claims)
        new_refresh = create_refresh_token(subject=user.id)

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def change_password(
        self, user_id: int, old_password: str, new_password: str, request: Request | None = None
    ) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User not found")
        if not verify_password(old_password, user.password_hash):
            raise UnauthorizedException("Current password is incorrect")

        await self.user_repo.update(user_id, password_hash=hash_password(new_password))

        await self.audit_service.log(
            action="password_change",
            resource="user",
            resource_id=str(user_id),
            user_id=user_id,
            request=request,
        )
