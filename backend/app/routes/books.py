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
# GET /api/books/search
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
# POST /api/books
@books_bp.route("/api/books", methods=["POST"])
def add_book():
    data = request.get_json()
    
    isbn = data.get("isbn")
    ten_sach = data.get("ten_sach")
    ten_nxb = data.get("ten_nxb")
    nam_xuat_ban = data.get("nam_xuat_ban")
    so_trang = data.get("so_trang")
    mo_ta = data.get("mo_ta")
    gia_bia = data.get("gia_bia")
    
    tac_gia = data.get("tac_gia", [])
    the_loai = data.get("the_loai", [])
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Bắt đầu transaction
        conn.autocommit = False
        
        # Thêm đầu sách
        query_book = """
            EXEC sp_AddBook ?, ?, ?, ?, ?, ?, ?
        """
        
        cursor.execute(query_book, (isbn, ten_sach, ten_nxb, nam_xuat_ban, so_trang, mo_ta, gia_bia))
        
        # Thêm tác giả
        query_author = """
            EXEC sp_AddAuthorToBook ?, ?
        """
        for author in tac_gia:
            cursor.execute(query_author, (isbn, author))
            
        # Thêm thể loại
        query_category = """
            EXEC sp_AddCategoryToBook ?, ?
        """
        
        for category in the_loai:
            cursor.execute(query_category, (isbn, category))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Thêm sách thành công"
        }, 201
        
    except Exception as e:
        conn.rollback()
        
        return {
            "success": False,
            "message": str(e)
        }, 400
        
    finally:
        conn.close()

# Cập nhật thông tin trong bảng DauSach
# PUT /api/books/<isbn>
@books_bp.route("/api/books/<isbn>", methods=["PUT"])
def update_book(isbn):
    data = request.get_json()

    ten_sach = data.get("ten_sach")
    ten_nxb = data.get("ten_nxb")
    nam_xuat_ban = data.get("nam_xuat_ban")
    so_trang = data.get("so_trang")
    mo_ta = data.get("mo_ta")
    gia_bia = data.get("gia_bia")
    
    tac_gia = data.get("tac_gia", [])
    the_loai = data.get("the_loai", [])
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        conn.autocommit = False
        
        # Cập nhật Đầu sách
        query_book = """
            EXEC sp_UpdateBook ?, ?, ?, ?, ?, ?, ?
        """
        
        cursor.execute(query_book, (
            isbn, ten_sach, ten_nxb, nam_xuat_ban, so_trang, mo_ta, gia_bia
        ))
        
        # Xóa toàn bộ tác giả cũ
        query_remove_authors = """
            EXEC sp_RemoveAllAuthorsFromBook ?
        """
        
        cursor.execute(query_remove_authors, (isbn,))
        # Thêm các tác giả mới
        query_add_author = """
            EXEC sp_AddAuthorToBook ?, ?
        """
        for author in tac_gia:
            cursor.execute(query_add_author, (isbn, author))
            
        # Xóa toàn bộ thể loại cũ
        query_remove_categories = """
            EXEC sp_RemoveAllCategoriesFromBook ?
        """
        cursor.execute(query_remove_categories, (isbn,))
        # Thêm các thể loại mới
        query_add_category = """
            EXEC sp_AddCategoryToBook ?, ?
        """
        
        for category in the_loai:
            cursor.execute(query_add_category, (isbn, category))
            
        conn.commit()
        
        return {
            "success": True,
            "message": "Cập nhật sách thành công"
        }
    except Exception as e:
        conn.rollback()
        
        return {
            "success": False,
            "message": str(e)
        }, 400
    finally:
        conn.close()
        
# Xóa đầu sách
# DELETE /api/books/<isbn>
@books_bp.route("/api/books/<isbn>", methods=["DELETE"])
def delete_book(isbn):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        query = """
            EXEC sp_DeleteBook ?
        """
        
        cursor.execute(query, (isbn,))
        
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
        }, 400
        
    finally:
        conn.close()
    