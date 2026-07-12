from typing import Any

from fastapi import HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any = None,
    ):
        self.code = code
        self.details = details
        super().__init__(status_code=status_code, detail={"code": code, "message": message, "details": details})


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource", identifier: Any = None):
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} with identifier '{identifier}' not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, code="NOT_FOUND", message=msg)


class DuplicateException(AppException):
    def __init__(self, resource: str = "Resource", field: str = "identifier", value: Any = None):
        msg = f"{resource} with this {field} already exists"
        if value:
            msg = f"{resource} with {field} '{value}' already exists"
        super().__init__(
            status_code=status.HTTP_409_CONFLICT, code="DUPLICATE_ENTRY", message=msg
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
            details={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN, code="FORBIDDEN", message=message
        )


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", details: Any = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message=message,
            details=details,
        )


class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed", details: Any = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message=message,
            details=details,
        )


async def validation_exception_handler(_request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append(
            {
                "field": " -> ".join(str(loc) for loc in error.get("loc", [])),
                "message": error.get("msg", "Validation error"),
                "type": error.get("type", ""),
            }
        )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "errors": errors,
        },
    )


async def app_exception_handler(_request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.code,
            "message": exc.detail["message"] if isinstance(exc.detail, dict) else str(exc.detail),
            "errors": exc.detail.get("details") if isinstance(exc.detail, dict) else None,
        },
    )


async def generic_exception_handler(_request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "errors": None,
        },
    )
