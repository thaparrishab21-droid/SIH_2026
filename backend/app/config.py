import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Flash Flood & Landslide Early Warning System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # MySQL Database Config
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "root")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "flashflood_db")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
    
    # JWT Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-sih-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Pilot Region Settings
    DEFAULT_REGION_NAME: str = "Mandi Hilly District"
    DEFAULT_STATE: str = "Himachal Pradesh"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
