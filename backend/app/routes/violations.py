from flask import Blueprint, jsonify, request
from app.database import get_connection

violations_bp = Blueprint('violations_bp', __name__)

@violations_bp.route('/api/violations', methods=['GET'])
def get_violations():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Truy vấn danh sách sách trễ hạn hoặc có tiền phạt
        query = """
            SELECT ct.MaPhieuMuon, ct.MaSach, pm.MaDocGia, dg.HoTen, 
                   ct.HanTra, ct.TienPhat, ct.TinhTrangTra
            FROM ChiTietPhieuMuon ct
            JOIN PhieuMuon pm ON ct.MaPhieuMuon = pm.MaPhieuMuon
            JOIN DocGia dg ON pm.MaDocGia = dg.MaDocGia
            WHERE ct.TienPhat > 0 OR ct.NgayTra IS NULL AND ct.HanTra < GETDATE()
        """
        cursor.execute(query)
        
        # Chuyển kết quả thành danh sách Dictionary (JSON)
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
        
        # Thực thi Stored Procedure tính tiền phạt và khóa thẻ
        cursor.execute("EXEC sp_XuLyViPham")
        conn.commit()
        
        return jsonify({
            "success": True, 
            "data": {"message": "Đã chạy trình xử lý vi phạm tự động thành công!"}
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()
