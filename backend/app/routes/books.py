from flask import Blueprint, request
from app.database import get_connection

books_bp = Blueprint("books", __name__)

# GET /api/books
@books_bp.route("/api/books", methods=["GET"])
def get_books():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_GetBooks
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
            "so_luong": row.SoLuong,
            "tac_gia": row.TacGia,
            "the_loai": row.TheLoai
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
    query = """
        EXEC sp_GetBooksByISBN ?
    """
    
    cursor.execute(query, (isbn,))
    
    row = cursor.fetchone()
    
    conn.close()
    
    if row is None:
        return {
            "success": False,
            "message": "Không tìm thấy sách!"
        }, 404
    
    result = {
        "isbn": row.ISBN,
        "ten_sach": row.TenSach,
        "nha_xuat_ban": row.TenNXB,
        "nam_xuat_ban": row.NamXuatBan,
        "gia_bia": float(row.GiaBia),
        "so_luong": row.SoLuong,
        "tac_gia": row.TacGia,
        "the_loai": row.TheLoai
    }
    
    return {
        "success": True,
        "data": result
    }
    
# Tìm kiếm sách theo isbn, tác giả, tên sách, thể loại
@books_bp.route("/api/books/search", methods=["GET"])
def search_books():
    
    keyword = request.args.get("q", "").strip()
    search_type = request.args.get("type", "all")
    
    if not keyword:
        return {
            "success": False,
            "message": "Vui lòng nhập lại từ khóa tìm kiếm"
        }, 400
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tìm kiếm theo tên sách, ISBN, Tên tác giả, Thể loại
    query = """
        EXEC sp_SearchBooks ?, ?
    """
    
    cursor.execute(
        query, (keyword, search_type)
    )
    
    rows = cursor.fetchall()
    
    books = []
    
    for row in rows:
        books.append({
            "isbn": row.ISBN,
            "ten_sach": row.TenSach,
            "nha_xuat_ban": row.TenNXB,
            "nam_xuat_ban": row.NamXuatBan,
            "gia_bia": float(row.GiaBia),
            "so_luong": row.SoLuong,
            "tac_gia": row.TacGia,
            "the_loai": row.TheLoai
        })
        
    conn.close()
    
    return {
        "success": True,
        "data": books
    }

# Thêm sách
@books_bp.route("/api/books", methods=["POST"])
def add_book():
    data = request.get_json()
    
    isbn = data.get("isbn")
    ten_sach = data.get("ten_sach")
    ma_so_nxb = data.get("ma_so_nxb")
    nam_xuat_ban = data.get("nam_xuat_ban")
    so_trang = data.get("so_trang")
    mo_ta = data.get("mo_ta")
    gia_bia = data.get("gia_bia")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    INSERT INTO DauSach (
	ISBN, MaSoNXB, TenSach, NamXuatBan, SoTrang, MoTa, GiaBia
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        cursor.execute(query, (isbn, ma_so_nxb, ten_sach, nam_xuat_ban, so_trang, mo_ta, gia_bia))
        
        conn.commit()
        return {
            "success": True,
            "message": "Thêm sách thành công"
        }, 201
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }, 400
        
    finally:
        conn.close()

# Cập nhật thông tin trong bảng DauSach
@books_bp.route("/api/books/<isbn>", methods=["PUT"])
def update_book(isbn):
    data = request.get_json()
    
    ten_sach = data.get("ten_sach")
    ma_so_nxb = data.get("ma_so_nxb")
    nam_xuat_ban = data.get("nam_xuat_ban")
    so_trang = data.get("so_trang")
    mo_ta = data.get("mo_ta")
    gia_bia = data.get("gia_bia")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    UPDATE DauSach
    SET
        MaSoNXB = ?,
        TenSach = ?,
        NamXuatBan = ?,
        SoTrang = ?,
        MoTa = ?,
        GiaBia = ?
    WHERE ISBN = ?
    """
    if not all([
        ten_sach,
        ma_so_nxb,
        nam_xuat_ban,
        so_trang,
        gia_bia
    ]):
        return {
            "success": False,
            "message": "Thiếu dữ liệu bắt buộc"
        }, 400
    
    try:
        cursor.execute(query, (
            ma_so_nxb, ten_sach, nam_xuat_ban, so_trang, mo_ta, gia_bia, isbn
        ))
        
        if cursor.rowcount == 0:
            conn.close()
            return {
                "success": False,
                "message": "Không tìm thấy sách"
            }, 404
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Cập nhật sách thành công"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }, 400
    
    finally:
        conn.close()
        
# Xóa đầu sách
@books_bp.route("/api/books/<isbn>", methods=["DELETE"])
def delete_book(isbn):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Kiểm tra đầu sách có tồn tại hay không
        cursor.execute(
            "SELECT ISBN FROM DauSach WHERE ISBN = ?",
            (isbn,)
        )
        
        if cursor.fetchone() is None:
            return {
                "success": False,
                "message": "Không tìm thấy sách"
            }, 404
            
        # Kiểm tra còn cuốn sách vật lý nào không
        cursor.execute(
            "SELECT COUNT(*) FROM CuonSach WHERE ISBN = ?",
            (isbn,)
        )
        
        so_luong = cursor.fetchone()[0]
        
        if so_luong > 0:
            return {
                "success": False,
                "message": "Không thể xóa đầu sách vì vẫn còn các cuốn sách thuộc đầu sách này"
            }, 400
            
        # Xóa các bảng liên kết
        cursor.execute(
            "DELETE FROM TacGia_DauSach WHERE ISBN = ?",
            (isbn,)
        )
        
        cursor.execute(
            "DELETE FROM TheLoai_DauSach WHERE ISBN = ?",
            (isbn,)
        )
        
        # Xóa đầu sách
        cursor.execute(
            "DELETE FROM DauSach WHERE ISBN = ?",
            (isbn,)
        )
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Xóa đầu sách thành công!"
        }
        
    except Exception as e:
        conn.rollback()
        
        return {
            "success": False,
            "message": str(e)
        }, 500
        
    finally:
        conn.close()
    