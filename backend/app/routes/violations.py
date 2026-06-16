from flask import Blueprint, jsonify
from app.database import get_connection

violations_bp = Blueprint('violations_bp', __name__)

@violations_bp.route('/', methods=['GET'])
def get_violations():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Truy vấn tìm độc giả đang nợ tiền hoặc có sách quá hạn chưa trả
        query = """
            SELECT DISTINCT 
                dg.MaDocGia, 
                dg.HoTen, 
                dg.Email, 
                dg.SoDienThoai, 
                dg.TongNo
            FROM DocGia dg
            LEFT JOIN PhieuMuon pm ON dg.MaDocGia = pm.MaDocGia
            LEFT JOIN ChiTietPhieuMuon ct ON pm.MaPhieuMuon = ct.MaPhieuMuon
            WHERE dg.TongNo > 0 
               OR (ct.HanTra < GETDATE() AND ct.NgayTra IS NULL)
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        # Chuyển đổi dữ liệu sang định dạng danh sách dictionary
        danh_sach_vi_pham = []
        for row in rows:
            danh_sach_vi_pham.append({
                "ma_doc_gia": row[0],
                "ho_ten": row[1],
                "email": row[2],
                "so_dien_thoai": row[3],
                "tong_no": float(row[4]) if row[4] else 0.0
            })

        return jsonify({
            "success": True,
            "data": danh_sach_vi_pham
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi truy vấn cơ sở dữ liệu: {str(e)}"
        }), 500
        
    finally:
        if conn:
            conn.close()