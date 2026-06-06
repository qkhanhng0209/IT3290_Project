from flask import Blueprint
from app.database import get_connection

books_bp = Blueprint("books", __name__)

@books_bp.route("/api/books", methods=["GET"])
def get_books():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT ds.ISBN, ds.TenSach, nxb.TenNXB, ds.NamXuatBan, ds.GiaBia, COUNT(cs.MaSach) AS SoLuong
        FROM DauSach ds
        LEFT JOIN NXB nxb
        ON ds.MaSoNXB = nxb.MaSoNXB
        LEFT JOIN CuonSach cs
        ON ds.ISBN = cs.ISBN
        GROUP BY ds.ISBN, ds.TenSach, nxb.TenNXB, ds.NamXuatBan, ds.GiaBia
        ORDER BY ds.TenSach
    """
    
    cursor.execute(query)
    
    rows = cursor.fetchall()
    
    books = []
    
    for row in rows:
        books.append({
            "isbn": row.ISBN,
            "ten_sach": row.TenSach,
            "nha_xuat_ban": row.TenNXB,
            "nam_xuat_ban": row.NamXuatBan,
            "gia_bia": float(row.GiaBia),
            "so_luong": row.SoLuong
        })
        
    conn.close()
    
    return {
        "success": True,
        "data": books
    }