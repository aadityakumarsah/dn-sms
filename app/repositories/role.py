from app.models.role import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db):
        super().__init__(db, Role)

    async def get_by_name(self, name: str) -> Role | None:
        return await self.get_by_field("name", name)

    async def list_roles(
        self,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "name",
        sort_order: str = "asc",
        search: str | None = None,
    ) -> tuple[list[Role], int]:
        return await self.list_all(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
            search_fields=["name", "description"],
            filters=None,
        )
