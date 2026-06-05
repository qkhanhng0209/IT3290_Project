import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_SERVER = os.getenv("DB_SERVER")
    DB_NAME = os.getenv("DB_NAME")