from fastapi import APIRouter, Query, Request

from app.core.dependencies import CurrentUser, DbSession, AuditService
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: str | None = Query(None),
    role_id: int | None = Query(None),
    is_active: bool | None = Query(None),
) -> PaginatedResponse[UserResponse]:
    service = UserService(db)
    users, total = await service.list_users(
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        role_id=role_id,
        is_active=is_active,
    )
    return PaginatedResponse[UserResponse].create(
        data=[UserResponse(**u) for u in users],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    service = UserService(db)
    user = await service.get_user(current_user.id)
    return UserResponse(**user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    service = UserService(db)
    user = await service.get_user(user_id)
    return UserResponse(**user)


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
    audit: AuditService,
) -> UserResponse:
    service = UserService(db)
    user = await service.create_user(
        data=body.model_dump(),
        current_user_id=current_user.id,
        request=request,
    )
    return UserResponse(**user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: UserUpdate,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    service = UserService(db)
    user = await service.update_user(
        user_id=user_id,
        data=body.model_dump(exclude_unset=True),
        current_user_id=current_user.id,
        request=request,
    )
    return UserResponse(**user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: int,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    service = UserService(db)
    await service.delete_user(
        user_id=user_id,
        current_user_id=current_user.id,
        request=request,
    )
    return MessageResponse(success=True, message="User deleted successfully")
