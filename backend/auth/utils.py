"""Token utilities for JWT verification."""

from jose import jwt, JWTError
from app.config import get_settings


def verify_token(token: str) -> str | None:
    """
    Verify a JWT token and extract the user ID.

    Args:
        token: The JWT token string to verify

    Returns:
        The user ID from the token's 'sub' claim, or None if invalid

    Raises:
        Exception: If token verification fails
    """
    settings = get_settings()

    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
        )

        # Extract user ID from 'sub' claim (standard JWT claim for subject)
        user_id: str | None = payload.get("sub")

        if user_id is None:
            raise Exception("Token missing user ID")

        return user_id

    except JWTError as e:
        raise Exception(f"Invalid token: {str(e)}")


def create_token(user_id: str) -> str:
    """
    Create a JWT token for a user (for testing purposes).

    Args:
        user_id: The user ID to encode in the token

    Returns:
        The encoded JWT token string
    """
    settings = get_settings()

    payload = {
        "sub": user_id,
    }

    return jwt.encode(
        payload,
        settings.better_auth_secret,
        algorithm="HS256",
    )
