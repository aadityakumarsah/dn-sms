from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    code: str
    message: str
    errors: Any = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(cls, data: list[T], total: int, page: int, per_page: int) -> "PaginatedResponse[T]":
        total_pages = max(1, (total + per_page - 1) // per_page)
        return cls(
            data=data,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )


class TimestampSchema(BaseModel):
    created_at: datetime
    updated_at: datetime | None = None
