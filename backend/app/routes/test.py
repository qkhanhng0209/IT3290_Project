from flask import Blueprint
from app.database import get_connection

test_bp = Blueprint("test", __name__)

@test_bp.route("/api/docgia/count")
def count_docgia():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM DocGia")

    count = cursor.fetchone()[0]

    conn.close()

    return {
        "so_doc_gia": count
    }