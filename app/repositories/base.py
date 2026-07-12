from typing import Any, Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: AsyncSession, model: type[ModelType]):
        self.db = db
        self.model = model

    async def get_by_id(self, id: int) -> ModelType | None:
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.unique().scalar_one_or_none()

    async def get_by_field(self, field: str, value: Any) -> ModelType | None:
        column = getattr(self.model, field, None)
        if column is None:
            raise ValueError(f"Field '{field}' does not exist on {self.model.__name__}")
        result = await self.db.execute(select(self.model).where(column == value))
        return result.unique().scalar_one_or_none()

    async def list_all(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        search: str | None = None,
        search_fields: list[str] | None = None,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[ModelType], int]:
        query = select(self.model)

        if filters:
            for field, value in filters.items():
                column = getattr(self.model, field, None)
                if column is not None and value is not None:
                    query = query.where(column == value)

        if search and search_fields:
            conditions = []
            for field in search_fields:
                column = getattr(self.model, field, None)
                if column is not None:
                    conditions.append(column.ilike(f"%{search}%"))
            if conditions:
                from sqlalchemy import or_
                query = query.where(or_(*conditions))

        sort_column = getattr(self.model, sort_by, None)
        if sort_column is not None:
            query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())
        else:
            query = query.order_by(self.model.created_at.desc())

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        result = await self.db.execute(query)
        items = list(result.unique().scalars().all())

        return items, total

    async def create(self, **kwargs) -> ModelType:
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(self, id: int, **kwargs) -> ModelType | None:
        instance = await self.get_by_id(id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, id: int) -> bool:
        instance = await self.get_by_id(id)
        if not instance:
            return False
        await self.db.delete(instance)
        await self.db.flush()
        return True

    async def exists(self, field: str, value: Any) -> bool:
        column = getattr(self.model, field, None)
        if column is None:
            return False
        result = await self.db.execute(select(self.model).where(column == value).limit(1))
        return result.unique().scalar_one_or_none() is not None
