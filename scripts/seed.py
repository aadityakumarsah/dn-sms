#!/usr/bin/env python3
"""Seed the database with initial roles and a super admin user."""

import asyncio

from app.core.security import hash_password
from app.database import async_session_factory
from app.models.role import Role
from app.models.user import User

ROLES = [
    {
        "name": "super_admin",
        "description": "Full system access with all permissions",
        "is_system": True,
        "permissions": [
            "users:create", "users:read", "users:update", "users:delete",
            "roles:create", "roles:read", "roles:update", "roles:delete",
            "audit:read",
            "settings:read", "settings:update",
            "attendance:create", "attendance:read", "attendance:update", "attendance:delete",
            "examinations:create", "examinations:read", "examinations:update", "examinations:delete",
            "fees:create", "fees:read", "fees:update", "fees:delete",
            "library:create", "library:read", "library:update", "library:delete",
            "transport:create", "transport:read", "transport:update", "transport:delete",
            "hostel:create", "hostel:read", "hostel:update", "hostel:delete",
            "payroll:create", "payroll:read", "payroll:update", "payroll:delete",
            "notifications:create", "notifications:read", "notifications:update", "notifications:delete",
            "students:create", "students:read", "students:update", "students:delete",
            "staff:create", "staff:read", "staff:update", "staff:delete",
        ],
    },
    {
        "name": "admin",
        "description": "Administrative access to manage the system",
        "is_system": True,
        "permissions": [
            "users:create", "users:read", "users:update",
            "roles:read",
            "audit:read",
            "attendance:create", "attendance:read", "attendance:update",
            "examinations:create", "examinations:read", "examinations:update",
            "fees:create", "fees:read", "fees:update",
            "notifications:create", "notifications:read",
            "students:create", "students:read", "students:update",
            "staff:create", "staff:read", "staff:update",
        ],
    },
    {
        "name": "teacher",
        "description": "Teaching staff with access to classes and assessments",
        "is_system": True,
        "permissions": [
            "users:read",
            "attendance:create", "attendance:read", "attendance:update",
            "examinations:read", "examinations:update",
            "students:read",
            "notifications:create", "notifications:read",
        ],
    },
    {
        "name": "staff",
        "description": "Non-teaching administrative staff",
        "is_system": True,
        "permissions": [
            "users:read",
            "attendance:read",
            "fees:create", "fees:read",
            "library:read", "library:update",
            "students:read",
            "notifications:read",
        ],
    },
    {
        "name": "student",
        "description": "Students with access to their own data",
        "is_system": True,
        "permissions": [
            "users:read",
            "attendance:read",
            "examinations:read",
            "fees:read",
            "library:read",
            "notifications:read",
        ],
    },
    {
        "name": "parent",
        "description": "Parents with access to their children's data",
        "is_system": True,
        "permissions": [
            "users:read",
            "attendance:read",
            "examinations:read",
            "fees:read",
            "notifications:read",
        ],
    },
]


async def seed() -> None:
    async with async_session_factory() as session:
        existing_roles = await session.execute(
            __import__("sqlalchemy").select(Role).where(Role.name.in_([r["name"] for r in ROLES]))
        )
        existing_names = {r.name for r in existing_roles.scalars().all()}

        role_instances = {}
        for role_data in ROLES:
            if role_data["name"] not in existing_names:
                role = Role(**role_data)
                session.add(role)
                await session.flush()
                role_instances[role.name] = role
                print(f"Created role: {role.name}")
            else:
                result = await session.execute(
                    __import__("sqlalchemy").select(Role).where(Role.name == role_data["name"])
                )
                role_instances[role_data["name"]] = result.scalar_one()

        # Create default super admin if not exists
        result = await session.execute(
            __import__("sqlalchemy").select(User).where(User.username == "admin")
        )
        admin_user = result.scalar_one_or_none()
        if not admin_user:
            super_admin_role = role_instances.get("super_admin")
            user = User(
                email="admin@school.com",
                username="admin",
                password_hash=hash_password("Admin@123"),
                first_name="Super",
                last_name="Admin",
                is_superuser=True,
                is_active=True,
                role_id=super_admin_role.id if super_admin_role else None,
            )
            session.add(user)
            await session.flush()
            print(f"Created super admin user: admin / Admin@123")

        await session.commit()
        print("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
