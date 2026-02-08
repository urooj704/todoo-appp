"""MCP server startup script.

Run from backend/ directory:
    python -m mcp_server.run
"""

import os
import sys

# Add the backend directory to the path so we can import app modules
backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv

load_dotenv(os.path.join(backend_dir, ".env"))


def main():
    """Launch MCP server on configured port."""
    port = int(os.environ.get("MCP_SERVER_PORT", "8001"))

    from mcp_server.server import mcp_server

    mcp_server.run(transport="streamable-http", port=port)


if __name__ == "__main__":
    main()
