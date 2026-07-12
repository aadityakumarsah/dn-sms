from fastapi import APIRouter, Query

from app.core.dependencies import CurrentUser, DbSession
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_log import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("/", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: str | None = Query(None),
    action: str | None = Query(None),
    resource: str | None = Query(None),
    user_id: int | None = Query(None),
) -> PaginatedResponse[AuditLogResponse]:
    service = AuditLogService(db)
    logs, total = await service.list_logs(
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        action=action,
        resource=resource,
        user_id=user_id,
    )
    return PaginatedResponse[AuditLogResponse].create(
        data=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        per_page=per_page,
    )
