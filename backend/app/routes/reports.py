from flask import Blueprint
from app.database import get_connection

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/api/reports/books-by-category", methods=["GET"])
def report_books_by_category():
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportBooksByCategory
    """
    
    cursor.execute(query)
    
    rows = cursor.fetchall()
    
    reports = []
    
    for row in rows:
        reports.append({
            "ten_the_loai": row.TenTheLoai,
            "so_luong_dau_sach": row.SoLuongDauSach,
            "tong_so_cuon": row.TongSoCuon
        })
        
    conn.close()
    
    return {
        "success": True,
        "data": reports
    }
    
@reports_bp.route("/api/reports/books-by-publisher", methods=["GET"])
def report_books_by_publisher():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportBooksByPublisher
    """
    
    cursor.execute(query)
    
    rows = cursor.fetchall()
    
    reports = []
    
    for row in rows:
        reports.append({
            "ten_nxb": row.TenNXB,
            "so_luong_dau_sach": row.SoLuongDauSach,
            "tong_so_cuon": row.TongSoCuon
        })
        
    conn.close()
    
    return {
        "success": True,
        "data": reports
    }
    
@reports_bp.route("/api/reports/books-by-author", methods=["GET"])
def report_books_by_author():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportBooksByAuthor
    """
    
    cursor.execute(query)
    
    rows = cursor.fetchall()
    
    reports = []
    
    for row in rows:
        reports.append({
            "ten_tac_gia": row.TenTacGia,
            "so_luong_dau_sach": row.SoLuongDauSach,
            "tong_so_cuon": row.TongSoCuon
        })
        
    conn.close()
    
    return {
        "success": True,
        "data": reports
    }
    
@reports_bp.route("/api/reports/inventory", methods=["GET"])
def report_inventory():
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        EXEC sp_ReportInventory
    """
    
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
        
    conn.close()
    
    return {
        "success": True,
        "data": reports
    }
    