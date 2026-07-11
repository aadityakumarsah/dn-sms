from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateException, NotFoundException
from app.core.security import hash_password
from app.repositories.role import RoleRepository
from app.repositories.user import UserRepository
from app.services.audit_log import AuditLogService


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)
        self.role_repo = RoleRepository(db)
        self.audit_service = AuditLogService(db)

    async def create_user(
        self, data: dict[str, Any], current_user_id: int, request: Request | None = None
    ) -> dict[str, Any]:
        existing = await self.repo.get_by_email(data["email"])
        if existing:
            raise DuplicateException("User", "email", data["email"])

        existing = await self.repo.get_by_username(data["username"])
        if existing:
            raise DuplicateException("User", "username", data["username"])

        if data.get("role_id"):
            role = await self.role_repo.get_by_id(data["role_id"])
            if not role:
                raise NotFoundException("Role", data["role_id"])

        password = data.pop("password")
        data["password_hash"] = hash_password(password)

        user = await self.repo.create(**data)

        await self.audit_service.log(
            action="user_created",
            resource="user",
            resource_id=str(user.id),
            user_id=current_user_id,
            details={"email": data["email"], "username": data["username"]},
            request=request,
        )

        return self._format_user(user)

    async def get_user(self, user_id: int) -> dict[str, Any]:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)
        return self._format_user(user)

    async def update_user(
        self, user_id: int, data: dict[str, Any], current_user_id: int, request: Request | None = None
    ) -> dict[str, Any]:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)

        if data.get("email") and data["email"] != user.email:
            existing = await self.repo.get_by_email(data["email"])
            if existing:
                raise DuplicateException("User", "email", data["email"])

        if data.get("role_id"):
            role = await self.role_repo.get_by_id(data["role_id"])
            if not role:
                raise NotFoundException("Role", data["role_id"])

        old_role = user.role.name if user.role else None
        new_role = None
        if "role_id" in data:
            if data["role_id"]:
                new_role_obj = await self.role_repo.get_by_id(data["role_id"])
                new_role = new_role_obj.name if new_role_obj else None
            if old_role != new_role:
                await self.audit_service.log_role_change(
                    current_user_id, user_id, old_role, new_role, request
                )

        user = await self.repo.update(user_id, **data)
        if not user:
            raise NotFoundException("User", user_id)

        await self.audit_service.log(
            action="user_updated",
            resource="user",
            resource_id=str(user_id),
            user_id=current_user_id,
            details={k: v for k, v in data.items() if v is not None},
            request=request,
        )

        return self._format_user(user)

    async def delete_user(
        self, user_id: int, current_user_id: int, request: Request | None = None
    ) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)

        await self.repo.delete(user_id)

        await self.audit_service.log(
            action="user_deleted",
            resource="user",
            resource_id=str(user_id),
            user_id=current_user_id,
            details={"username": user.username, "email": user.email},
            request=request,
        )

    async def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        search: str | None = None,
        role_id: int | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        users, total = await self.repo.list_users(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
            role_id=role_id,
            is_active=is_active,
        )
        return [self._format_user(u) for u in users], total

    def _format_user(self, user) -> dict[str, Any]:
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "role_id": user.role_id,
            "role_name": user.role.name if user.role else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
