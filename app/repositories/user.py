from sqlalchemy import select

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db):
        super().__init__(db, User)

    async def get_by_email(self, email: str) -> User | None:
        return await self.get_by_field("email", email)

    async def get_by_username(self, username: str) -> User | None:
        return await self.get_by_field("username", username)

    async def get_by_email_or_username(self, identifier: str) -> User | None:
        result = await self.db.execute(
            select(User).where(
                (User.email == identifier) | (User.username == identifier)
            )
        )
        return result.unique().scalar_one_or_none()

    async def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        search: str | None = None,
        role_id: int | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[User], int]:
        filters = {}
        if role_id is not None:
            filters["role_id"] = role_id
        if is_active is not None:
            filters["is_active"] = is_active

        return await self.list_all(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
            search_fields=["username", "email", "first_name", "last_name"],
            filters=filters,
        )
