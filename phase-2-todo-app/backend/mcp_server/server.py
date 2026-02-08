"""MCP server entry point using FastMCP with stateless HTTP transport."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from mcp.server.fastmcp import FastMCP
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from starlette.middleware.cors import CORSMiddleware

import os


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[dict]:
    """Lifespan manager for database connection pool."""
    database_url = os.environ.get("DATABASE_URL", "")
    engine = create_async_engine(database_url, echo=False, pool_pre_ping=True)
    session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    try:
        yield {"db_session_maker": session_maker}
    finally:
        await engine.dispose()


# Create FastMCP server instance
mcp_server = FastMCP(
    "Todoo Task Manager",
    stateless_http=True,
    lifespan=app_lifespan,
)

# Register all task management tools
from mcp_server.tools.task_tools import register_task_tools

register_task_tools(mcp_server)

# Configure CORS to allow requests from OpenAI's hosted agent service
_app = mcp_server._mcp_server if hasattr(mcp_server, '_mcp_server') else None
if hasattr(mcp_server, 'settings') and hasattr(mcp_server.settings, 'app'):
    _app = mcp_server.settings.app

# Note: CORS middleware will be added when the server's ASGI app is created.
# FastMCP's streamable-http transport exposes a Starlette app.
# The MCP server accepts all origins by default for tool access from hosted agents.
