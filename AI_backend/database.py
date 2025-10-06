from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from typing import Optional, Any, Generator

# Optional: supabase client
try:
    from supabase import create_client, Client
    from supabase.client import ClientOptions
except Exception:
    create_client = None  # type: ignore
    Client = None  # type: ignore
    ClientOptions = None  # type: ignore

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASEURL")
SUPABASE_KEY = os.getenv("SUPABASEKEY")
SUPABASEPASS = os.getenv("SUPABASEPASS")
if SUPABASE_URL is None or SUPABASE_KEY is None or SUPABASEPASS is None:
    raise ValueError("SUPABASEURL and SUPABASEKEY must be set in environment variables")
host = SUPABASE_URL.split("//")[-1].rstrip("/")
db_host = f"db.{host}"
DB_URL = f"postgresql://postgres:{SUPABASEPASS}@{db_host}:5432/postgres"

# Create SQLAlchemy engine
engine = create_engine(DB_URL)
# Base class for all models
Base = declarative_base()

# Create a Supabase client (optional)
supabase: Optional[Any] = None
if create_client is not None and SUPABASE_URL and SUPABASE_KEY:
    try:
        # Build options only if ClientOptions was imported successfully
        options = None
        if ClientOptions is not None:
            options = ClientOptions(
                postgrest_client_timeout=10,
                storage_client_timeout=10,
                schema="public",
            )

        if options is not None:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY, options=options)
        else:
            # Fallback if ClientOptions isn't available in this environment
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        supabase = None



def get_supabase() -> Optional[Any]:
    """Return the initialized Supabase client (or None if not configured)."""
    return supabase


# SQLAlchemy session factory and dependency
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy Session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
