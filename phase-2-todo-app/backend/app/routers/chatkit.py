"""ChatKit authentication endpoint."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.dependencies import get_current_user_id
from app.config import Settings, get_settings
from app.schemas.task import ErrorResponse

router = APIRouter(
    prefix="/chatkit",
    tags=["ChatKit"],
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
    },
)


class ChatKitSessionResponse(BaseModel):
    """Response schema for ChatKit session creation."""

    client_secret: str


@router.post(
    "/session",
    response_model=ChatKitSessionResponse,
    responses={
        502: {"model": ErrorResponse, "description": "Bad Gateway - OpenAI API error"},
    },
)
async def create_chatkit_session(
    user_id: str = Depends(get_current_user_id),
    settings: Settings = Depends(get_settings),
) -> ChatKitSessionResponse:
    """
    Create a ChatKit session for the authenticated user.

    This endpoint proxies a request to OpenAI's Realtime API to create a session
    and returns the client_secret needed for ChatKit authentication.
    """
    # Prepare the OpenAI API request
    url = "https://api.openai.com/v1/realtime/sessions"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini-realtime-preview",
        "voice": "verse",
    }

    # Make the request to OpenAI
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()

            # Extract and return the client_secret
            client_secret = data.get("client_secret")
            if not client_secret:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="OpenAI API response missing client_secret",
                )

            return ChatKitSessionResponse(client_secret=client_secret)

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI API error: {e.response.status_code}",
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to OpenAI API: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unexpected error: {str(e)}",
            )
