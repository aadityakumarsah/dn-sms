from datetime import datetime

from pydantic import BaseModel, Field


class PermissionBase(BaseModel):
    resource: str = Field(..., description="Resource name (e.g., users, roles, attendance)")
    actions: list[str] = Field(..., description="Allowed actions (e.g., create, read, update, delete)")


class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Role name")
    description: str | None = Field(None, max_length=500, description="Role description")
    permissions: list[str] = Field(default_factory=list, description="List of permission strings")


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = Field(None, max_length=500)
    permissions: list[str] | None = None


class RoleResponse(RoleBase):
    id: int
    is_system: bool
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class RoleListResponse(BaseModel):
    success: bool = True
    data: list[RoleResponse]
    total: int
