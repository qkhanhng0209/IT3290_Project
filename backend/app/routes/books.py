from flask import Blueprint, request
from app.database import get_connection

books_bp = Blueprint("books", __name__)

# GET /api/books
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

# GET /api/books/<isbn>
@books_bp.route("/api/books/<isbn>", methods=["GET"])
def get_book_by_isbn(isbn):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Lấy thông tin chính của sách
    query_book = """
    SELECT ds.ISBN, ds.TenSach, ds.GiaBia, ds.NamXuatBan, nxb.TenNXB, COUNT(cs.MaSach) AS SoLuong
    FROM DauSach ds
    LEFT JOIN NXB nxb ON ds.MaSoNXB = nxb.MaSoNXB
    LEFT JOIN CuonSach cs ON ds.ISBN = cs.ISBN
    WHERE ds.ISBN = ?
    GROUP BY ds.ISBN, ds.TenSach, ds.GiaBia, ds.NamXuatBan, nxb.TenNXB
    """
    
    cursor.execute(query_book, (isbn,))
    book = cursor.fetchone()
    
    if not book:
        conn.close()
        return {
            "success": False,
            "message": "Không tìm thấy sách"
        }, 404
        
    # Lấy tác giả
    query_authors = """
    SELECT tg.TenTacGia
    FROM TacGia tg
    JOIN TacGia_DauSach tgds ON tg.MaSoTG = tgds.MaSoTG
    WHERE tgds.ISBN = ?
    """
    
    cursor.execute(query_authors, (isbn,))
    authors = [row.TenTacGia for row in cursor.fetchall()]
    
    # Lấy thể loại
    query_categories = """
    SELECT tl.TenTheLoai
    FROM TheLoai tl
    JOIN TheLoai_DauSach tlds ON tl.MaTheLoai = tlds.MaTheLoai
    WHERE tlds.ISBN = ?
    """
    
    cursor.execute(query_categories, (isbn,))
    categories = [row.TenTheLoai for row in cursor.fetchall()]
    
    result = {
        "isbn": book.ISBN,
        "ten_sach": book.TenSach,
        "gia_bia": float(book.GiaBia),
        "nam_xuat_ban": book.NamXuatBan,
        "nha_xuat_ban": book.TenNXB,
        "so_luong": book.SoLuong,
        "tac_gia": authors,
        "the_loai": categories
    }
    
    conn.close()
    
    return {
        "success": True,
        "data": result
    }
    
@books_bp.route("/api/books/search", methods=["GET"])
def search_books():
    
    keyword = request.args.get("q", "").strip()
    
    if not keyword:
        return {
            "success": False,
            "message": "Vui lòng nhập lại từ khóa tìm kiếm"
        }, 400
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT ds.ISBN, ds.TenSach, nxb.TenNXB, ds.NamXuatBan, ds.GiaBia, COUNT(cs.MaSach) as SoLuong
    FROM DauSach ds
    LEFT JOIN NXB nxb ON ds.MaSoNXB = nxb.MaSoNXB
    LEFT JOIN CuonSach cs on ds.ISBN = cs.ISBN
    WHERE ds.TenSach LIKE ?
    GROUP BY ds.ISBN, ds.TenSach, nxb.TenNXB, ds.NamXuatBan, ds.GiaBia
    ORDER BY ds.TenSach
    """
    
    cursor.execute(query, (f"%{keyword}%",))
    
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
    