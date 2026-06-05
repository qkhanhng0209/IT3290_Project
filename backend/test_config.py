from app.database import get_connection
from app.config import Config

print("Server:", Config.DB_SERVER)
print("Database:", Config.DB_NAME)

conn = get_connection()

print("Kết nối thành công")

conn.close()