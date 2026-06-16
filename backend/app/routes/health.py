from flask import Blueprint
from app.database import get_connection
from app.response import success, error

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()

        return success(data={
            "status": "ok",
            "database": "connected"
        })

    except Exception as e:
        return error(
            "Không kết nối được database",
            status=500,
            details=str(e)
        )

    finally:
        if conn is not None:
            conn.close()
