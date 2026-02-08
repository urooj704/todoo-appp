"""Environment configuration for the backend application."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str

    # Authentication
    better_auth_secret: str
    better_auth_url: str = "http://localhost:3000"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Phase III: AI Chatbot
    openai_api_key: str = ""
    mcp_server_port: int = 8001
    mcp_server_url: str = "http://localhost:8001"
    chatkit_workflow_id: str = ""
    next_public_app_url: str = "http://localhost:3000"
    max_conversation_history: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
