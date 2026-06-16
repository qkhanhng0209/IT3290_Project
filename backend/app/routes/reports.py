from flask import Blueprint
from app.database import get_connection
from app.response import success, error

reports_bp = Blueprint("reports", __name__)

# GET /api/reports/books-by-category
@reports_bp.route("/api/reports/books-by-category", methods=["GET"])
def report_books_by_category():
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportBooksByCategory
    """
    
    try:
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        reports = []
        
        for row in rows:
            reports.append({
                "ten_the_loai": row.TenTheLoai,
                "so_luong_dau_sach": row.SoLuongDauSach,
                "tong_so_cuon": row.TongSoCuon
            })
            
        return success(data=reports)
        
    except Exception as e:
        return error(str(e), 500)
    
    finally:
        conn.close()
    
# GET /api/reports/books-by-publisher
@reports_bp.route("/api/reports/books-by-publisher", methods=["GET"])
def report_books_by_publisher():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportBooksByPublisher
    """
    
    try:
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        reports = []
        
        for row in rows:
            reports.append({
                "ten_nxb": row.TenNXB,
                "so_luong_dau_sach": row.SoLuongDauSach,
                "tong_so_cuon": row.TongSoCuon
            })
        
        return success(data=reports)
    
    except Exception as e:
        return error(str(e), 500)
    
    finally:
        conn.close()
    
# GET /api/reports/books-by-author
@reports_bp.route("/api/reports/books-by-author", methods=["GET"])
def report_books_by_author():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportBooksByAuthor
    """
    
    try:
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        reports = []
        
        for row in rows:
            reports.append({
                "ten_tac_gia": row.TenTacGia,
                "so_luong_dau_sach": row.SoLuongDauSach,
                "tong_so_cuon": row.TongSoCuon
            })
        
        return success(data=reports)
    
    except Exception as e:
        return error(str(e), 500)
    
    finally:
        conn.close()
        
# GET /api/reports/inventory    
@reports_bp.route("/api/reports/inventory", methods=["GET"])
def report_inventory():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportInventory
    """
    
    try:
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        reports = []
        
        for row in rows:
            reports.append({
                "isbn": row.ISBN,
                "ten_sach": row.TenSach,
                "tong_so_cuon": row.TongSoCuon,
                "so_cuon_tot": row.SoCuonTot,
                "so_cuon_dang_muon": row.SoCuonDangMuon,
                "so_cuon_hong_nhe": row.SoCuonHongNhe,
                "so_cuon_hong_nang": row.SoCuonHongNang,
                "so_cuon_mat": row.SoCuonMat
            })
        
        return success(data=reports)
        
    except Exception as e:
        return error(str(e), 500)
    
    finally:
        conn.close()
    
# Trả về thông tin 10 đầu sách được mượn nhiều nhất
@reports_bp.route("/api/reports/top-books", methods=["GET"])
def top_books():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_TopBooks
    """
    
    try:
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        reports = []
        
        for row in rows:
            reports.append({
                "isbn": row.ISBN,
                "ten_sach": row.TenSach,
                "so_luot_muon": row.SoLuotMuon
            })
            
        return success(data=reports)
    
    except Exception as e:
        return error(str(e), 500)
    
    finally:
        conn.close()
    
# Trả về 10 độc giả tích cực nhất
@reports_bp.route("/api/reports/top-readers", methods=["GET"])
def top_readers():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_TopReaders
    """
    
    try:
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        reports = []
        
        for row in rows:
            reports.append({
                "ma_doc_gia": row.MaDocGia,
                "ho_ten": row.HoTen,
                "tong_so_sach_muon": row.TongSoSachMuon
            })
        
        return success(data=reports)
    
    
    except Exception as e:
        return error(str(e), 500)
    
    finally:
        conn.close()