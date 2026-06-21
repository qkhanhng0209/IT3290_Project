from flask import Blueprint, request, jsonify
from app.database import get_connection

# 1. Khai báo Blueprint trước
violations_bp = Blueprint('violations_bp', __name__)

# 2. Sau đó mới dùng violations_bp để khai báo các route
@violations_bp.route('/api/violations', methods=['GET'])
def get_violations():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        ma_doc_gia = request.args.get('ma_doc_gia')
        role = request.args.get('role')

        if role == 'reader':
            if not ma_doc_gia or ma_doc_gia == 'undefined':
                return jsonify({"success": False, "message": "Truy cập bị từ chối"}), 403
            query = """
                SELECT ct.MaPhieuMuon, ct.MaSach, pm.MaDocGia, dg.HoTen, 
                       ct.HanTra, ct.TienPhat, ct.TinhTrangTra
                FROM ChiTietPhieuMuon ct
                JOIN PhieuMuon pm ON ct.MaPhieuMuon = pm.MaPhieuMuon
                JOIN DocGia dg ON pm.MaDocGia = dg.MaDocGia
                WHERE (ct.TienPhat > 0 OR (ct.NgayTra IS NULL AND ct.HanTra < GETDATE()))
                AND pm.MaDocGia = ?
            """
            cursor.execute(query, (ma_doc_gia,))
        else:
            query = """
                SELECT ct.MaPhieuMuon, ct.MaSach, pm.MaDocGia, dg.HoTen, 
                       ct.HanTra, ct.TienPhat, ct.TinhTrangTra
                FROM ChiTietPhieuMuon ct
                JOIN PhieuMuon pm ON ct.MaPhieuMuon = pm.MaPhieuMuon
                JOIN DocGia dg ON pm.MaDocGia = dg.MaDocGia
                WHERE ct.TienPhat > 0 OR (ct.NgayTra IS NULL AND ct.HanTra < GETDATE())
            """
            cursor.execute(query)

        columns = [column[0] for column in cursor.description]
        data = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@violations_bp.route('/api/violations', methods=['POST'])
def trigger_violations():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("EXEC sp_XuLyViPham")
        conn.commit()
        return jsonify({"success": True, "data": {"message": "Đã xử lý xong!"}}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()