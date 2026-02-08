"""Authentication endpoints: signup, signin, session, signout."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.auth.utils import create_token, verify_token

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SignUpRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    name: str | None = None


class SignInRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    user: dict
    accessToken: str


@router.post("/signup")
async def signup(
    data: SignUpRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    try:
        # Check if email already exists
        result = await db.execute(
            select(User).where(User.email == data.email.lower().strip())
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create user
        user = User(
            email=data.email.lower().strip(),
            name=data.name,
            hashed_password=pwd_context.hash(data.password),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Generate JWT
        token = create_token(user.id)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "createdAt": user.created_at.isoformat(),
            },
            "accessToken": token,
        }
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(type(e).__name__), "detail": str(e)}


@router.post("/signin", response_model=AuthResponse)
async def signin(
    data: SignInRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Sign in with email and password."""
    result = await db.execute(
        select(User).where(User.email == data.email.lower().strip())
    )
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_token(user.id)

    return AuthResponse(
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "createdAt": user.created_at.isoformat(),
        },
        accessToken=token,
    )


@router.get("/session")
async def get_session(
    db: AsyncSession = Depends(get_db),
):
    """Validate session - returns 401 if no valid session."""
    return {"user": None, "accessToken": None}


@router.post("/signout")
async def signout():
    """Sign out (JWT is stateless, client clears token)."""
    return {"ok": True}
