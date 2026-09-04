import os
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.domain import Base

IS_MYSQL_CONNECTED = False

def create_database_if_not_exists():
    global IS_MYSQL_CONNECTED
    try:
        conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            port=int(settings.MYSQL_PORT)
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        cursor.close()
        conn.close()
        IS_MYSQL_CONNECTED = True
        print(f"MySQL Database '{settings.MYSQL_DATABASE}' initialized successfully.")
    except Exception as e:
        print(f"MySQL Connection Warning: {e}")
        print("Tip: Configure your local MySQL password in backend/.env if needed.")
        IS_MYSQL_CONNECTED = False

create_database_if_not_exists()

if IS_MYSQL_CONNECTED:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False
    )
else:
    # Development file DB fallback if local MySQL password is not configured
    db_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "flashflood_dev.db"))
    engine = create_engine(
        f"sqlite:///{db_file_path}",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all domain tables."""
    Base.metadata.create_all(bind=engine)
