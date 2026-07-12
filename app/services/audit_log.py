from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.repo = BaseRepository(db, AuditLog)

    async def log(
        self,
        action: str,
        resource: str,
        resource_id: str | None = None,
        user_id: int | None = None,
        details: dict[str, Any] | None = None,
        request: Request | None = None,
    ) -> AuditLog:
        ip_address = None
        user_agent = None
        if request:
            forwarded = request.headers.get("X-Forwarded-For")
            ip_address = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else None
            user_agent = request.headers.get("User-Agent")

        return await self.repo.create(
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id is not None else None,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def log_login(
        self, user_id: int, request: Request | None = None, success: bool = True
    ) -> None:
        await self.log(
            action="login" if success else "login_failed",
            resource="auth",
            user_id=user_id if success else None,
            details={"user_id": user_id, "success": success},
            request=request,
        )

    async def log_logout(self, user_id: int, request: Request | None = None) -> None:
        await self.log(
            action="logout",
            resource="auth",
            user_id=user_id,
            request=request,
        )

    async def log_role_change(
        self,
        user_id: int,
        target_user_id: int,
        old_role: str | None,
        new_role: str | None,
        request: Request | None = None,
    ) -> None:
        await self.log(
            action="role_change",
            resource="user",
            resource_id=str(target_user_id),
            user_id=user_id,
            details={"old_role": old_role, "new_role": new_role},
            request=request,
        )

    async def list_logs(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "timestamp",
        sort_order: str = "desc",
        search: str | None = None,
        action: str | None = None,
        resource: str | None = None,
        user_id: int | None = None,
    ) -> tuple[list[AuditLog], int]:
        filters = {}
        if action:
            filters["action"] = action
        if resource:
            filters["resource"] = resource
        if user_id:
            filters["user_id"] = user_id

        return await self.repo.list_all(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
            search_fields=["action", "resource", "resource_id"],
            filters=filters,
        )
