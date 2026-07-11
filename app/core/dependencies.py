from typing import Annotated, Any, Callable

from fastapi import Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.models import User
from app.repositories.user import UserRepository
from app.services.audit_log import AuditLogService
from app.database import get_db

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if not credentials:
        raise UnauthorizedException("Authentication required")
    payload = decode_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise UnauthorizedException("Invalid or expired token")
    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(int(payload["sub"]))
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


def require_permissions(*permissions: str) -> Callable:
    async def dependency(current_user: CurrentUser) -> User:
        user_permissions = current_user.role.permissions if current_user.role else []
        user_permission_set = set(user_permissions)
        missing = [p for p in permissions if p not in user_permission_set]
        if missing:
            raise ForbiddenException(f"Missing permissions: {', '.join(missing)}")
        return current_user
    return Depends(dependency)


def require_roles(*roles: str) -> Callable:
    async def dependency(current_user: CurrentUser) -> User:
        if not current_user.role or current_user.role.name not in roles:
            raise ForbiddenException(f"Requires one of roles: {', '.join(roles)}")
        return current_user
    return Depends(dependency)


async def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction"),
    search: str | None = Query(None, description="Search keyword"),
) -> dict:
    return {
        "page": page,
        "per_page": per_page,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "search": search,
    }


PaginationParams = Annotated[dict, Depends(get_pagination_params)]


class RateLimiter:
    def __init__(self, redis_client=None):
        self.redis = redis_client

    async def check_rate_limit(self, request: Request, key: str | None = None) -> None:
        if not settings.RATE_LIMIT_ENABLED or not self.redis:
            return
        identifier = key or request.client.host if request.client else "unknown"
        import time
        current = int(time.time())
        window_key = f"ratelimit:{identifier}:{current // settings.RATE_LIMIT_PERIOD_SECONDS}"
        count = await self.redis.incr(window_key)
        if count == 1:
            await self.redis.expire(window_key, settings.RATE_LIMIT_PERIOD_SECONDS)
        if count > settings.RATE_LIMIT_REQUESTS:
            from app.core.exceptions import AppException
            from fastapi import status
            raise AppException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                code="RATE_LIMITED",
                message=f"Rate limit exceeded. Max {settings.RATE_LIMIT_REQUESTS} requests per {settings.RATE_LIMIT_PERIOD_SECONDS}s",
            )


async def get_audit_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AuditLogService:
    return AuditLogService(db)


AuditService = Annotated[AuditLogService, Depends(get_audit_service)]
