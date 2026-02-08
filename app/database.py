"""Database connection and session management."""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Create SSL context for Neon PostgreSQL
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Get database URL and strip query params that asyncpg doesn't understand
db_url = get_settings().database_url
# Remove sslmode/ssl/channel_binding params - we handle SSL via connect_args
for param in ["sslmode=require", "ssl=require", "channel_binding=require", "&channel_binding=require"]:
    db_url = db_url.replace(param, "")
# Clean up trailing ? or &
db_url = db_url.rstrip("?&").replace("?&", "?").replace("&&", "&")

# Create async engine
engine = create_async_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": ssl_context},
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    # Import all models so Base.metadata knows about them
    from app.models import Task, Conversation, Message, User  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
