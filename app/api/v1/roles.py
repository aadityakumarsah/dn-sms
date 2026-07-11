from fastapi import APIRouter, Query, Request

from app.core.dependencies import CurrentUser, DbSession
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from app.services.role import RoleService

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=PaginatedResponse[RoleResponse])
async def list_roles(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("name"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    search: str | None = Query(None),
) -> PaginatedResponse[RoleResponse]:
    service = RoleService(db)
    roles, total = await service.list_roles(
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
    )
    return PaginatedResponse[RoleResponse].create(
        data=[RoleResponse(**r) for r in roles],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> RoleResponse:
    service = RoleService(db)
    role = await service.get_role(role_id)
    return RoleResponse(**role)


@router.post("/", response_model=RoleResponse, status_code=201)
async def create_role(
    body: RoleCreate,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> RoleResponse:
    service = RoleService(db)
    role = await service.create_role(
        data=body.model_dump(),
        current_user_id=current_user.id,
        request=request,
    )
    return RoleResponse(**role)


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    body: RoleUpdate,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> RoleResponse:
    service = RoleService(db)
    role = await service.update_role(
        role_id=role_id,
        data=body.model_dump(exclude_unset=True),
        current_user_id=current_user.id,
        request=request,
    )
    return RoleResponse(**role)


@router.delete("/{role_id}", response_model=MessageResponse)
async def delete_role(
    role_id: int,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    service = RoleService(db)
    await service.delete_role(
        role_id=role_id,
        current_user_id=current_user.id,
        request=request,
    )
    return MessageResponse(success=True, message="Role deleted successfully")
