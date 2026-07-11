from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, DuplicateException, NotFoundException
from app.repositories.role import RoleRepository
from app.services.audit_log import AuditLogService


class RoleService:
    def __init__(self, db: AsyncSession):
        self.repo = RoleRepository(db)
        self.audit_service = AuditLogService(db)

    async def create_role(
        self, data: dict[str, Any], current_user_id: int, request: Request | None = None
    ) -> dict[str, Any]:
        existing = await self.repo.get_by_name(data["name"])
        if existing:
            raise DuplicateException("Role", "name", data["name"])

        role = await self.repo.create(**data)

        await self.audit_service.log(
            action="role_created",
            resource="role",
            resource_id=str(role.id),
            user_id=current_user_id,
            details={"name": data["name"]},
            request=request,
        )

        return self._format_role(role)

    async def get_role(self, role_id: int) -> dict[str, Any]:
        role = await self.repo.get_by_id(role_id)
        if not role:
            raise NotFoundException("Role", role_id)
        return self._format_role(role)

    async def update_role(
        self, role_id: int, data: dict[str, Any], current_user_id: int, request: Request | None = None
    ) -> dict[str, Any]:
        role = await self.repo.get_by_id(role_id)
        if not role:
            raise NotFoundException("Role", role_id)

        if role.is_system and "permissions" in data:
            raise BadRequestException("Cannot modify system role permissions")

        if data.get("name") and data["name"] != role.name:
            existing = await self.repo.get_by_name(data["name"])
            if existing:
                raise DuplicateException("Role", "name", data["name"])

        role = await self.repo.update(role_id, **data)
        if not role:
            raise NotFoundException("Role", role_id)

        await self.audit_service.log(
            action="role_updated",
            resource="role",
            resource_id=str(role_id),
            user_id=current_user_id,
            details={k: v for k, v in data.items() if v is not None},
            request=request,
        )

        return self._format_role(role)

    async def delete_role(
        self, role_id: int, current_user_id: int, request: Request | None = None
    ) -> None:
        role = await self.repo.get_by_id(role_id)
        if not role:
            raise NotFoundException("Role", role_id)
        if role.is_system:
            raise BadRequestException("Cannot delete system role")

        await self.repo.delete(role_id)

        await self.audit_service.log(
            action="role_deleted",
            resource="role",
            resource_id=str(role_id),
            user_id=current_user_id,
            details={"name": role.name},
            request=request,
        )

    async def list_roles(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "name",
        sort_order: str = "asc",
        search: str | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        roles, total = await self.repo.list_roles(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
        )
        return [self._format_role(r) for r in roles], total

    def _format_role(self, role) -> dict[str, Any]:
        return {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions or [],
            "is_system": role.is_system,
            "created_at": role.created_at.isoformat() if role.created_at else None,
            "updated_at": role.updated_at.isoformat() if role.updated_at else None,
        }
