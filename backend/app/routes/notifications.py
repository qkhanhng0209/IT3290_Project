from flask import Blueprint, jsonify, request
from app.database import get_connection

notifications_bp = Blueprint('notifications_bp', __name__)

@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("EXEC sp_TaoThongBao")
        conn.commit()

        ma_doc_gia = request.args.get('ma_doc_gia')
        
        # CHỈ LỌC NẾU CÓ MÃ ĐỘC GIẢ. Nếu không có mã, trả về danh sách rỗng (Không cho xem tất cả)
        if ma_doc_gia and ma_doc_gia != 'undefined' and ma_doc_gia != 'null':
            query = "SELECT MaThongBao, MaDocGia, NoiDung, LoaiThongBao, NgayGui FROM ThongBao WHERE MaDocGia = ? ORDER BY NgayGui DESC"
            cursor.execute(query, (ma_doc_gia,))
        else:
            # Không cho xem tất cả -> Trả về danh sách rỗng
            return jsonify({"success": True, "data": []}), 200

        data = []
        for row in cursor.fetchall():
            data.append({
                "MaThongBao": row[0],
                "MaDocGia": row[1],
                "NoiDung": row[2],
                "TieuDe": row[3],
                "LoaiThongBao": row[3],
                "NgayGui": str(row[4])
            })

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()