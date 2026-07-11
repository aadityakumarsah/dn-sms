import os
import uuid
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings
from app.core.exceptions import BadRequestException, NotFoundException


class FileStorage:
    def __init__(self, base_dir: str | None = None):
        self.base_dir = Path(base_dir or settings.UPLOAD_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _validate_extension(self, filename: str) -> str:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise BadRequestException(
                f"File extension '{ext}' not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        return ext

    def _generate_path(self, subdir: str, ext: str) -> Path:
        directory = self.base_dir / subdir
        directory.mkdir(parents=True, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        return directory / unique_name

    async def save(
        self,
        file: BinaryIO,
        filename: str,
        subdir: str = "general",
        content_length: int | None = None,
    ) -> str:
        ext = self._validate_extension(filename)

        if content_length and content_length > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise BadRequestException(
                f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        file_path = self._generate_path(subdir, ext)
        file_path.write_bytes(file.read())

        relative_path = str(file_path.relative_to(self.base_dir.parent if self.base_dir.parent.exists() else self.base_dir))
        return relative_path

    def get_path(self, relative_path: str) -> Path:
        full_path = self.base_dir / relative_path
        if not full_path.exists() or not full_path.is_file():
            raise NotFoundException("File", relative_path)
        return full_path

    def delete(self, relative_path: str) -> bool:
        full_path = self.base_dir / relative_path
        if full_path.exists() and full_path.is_file():
            full_path.unlink()
            return True
        return False


file_storage = FileStorage()
