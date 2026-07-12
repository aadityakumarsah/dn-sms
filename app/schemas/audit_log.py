from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    action: str
    resource: str
    resource_id: str | None = None
    details: Any = None
    ip_address: str | None = None
    user_agent: str | None = None
    timestamp: datetime

    model_config = {"from_attributes": True}
