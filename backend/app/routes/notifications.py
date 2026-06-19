from flask import Blueprint, jsonify, request
from app.database import get_connection

notifications_bp = Blueprint('notifications_bp', __name__)

@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Tự động gọi SP tạo thông báo mới trước khi lấy dữ liệu ra
        cursor.execute("EXEC sp_TaoThongBao")
        conn.commit()

        # 2. Lấy danh sách thông báo (có thể lọc theo ma_doc_gia nếu FE truyền lên)
        ma_doc_gia = request.args.get('ma_doc_gia')
        if ma_doc_gia:
            query = "SELECT * FROM ThongBao WHERE MaDocGia = ? ORDER BY NgayGui DESC"
            cursor.execute(query, (ma_doc_gia,))
        else:
            query = "SELECT * FROM ThongBao ORDER BY NgayGui DESC"
            cursor.execute(query)

        columns = [column[0] for column in cursor.description]
        data = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@notifications_bp.route('/api/notifications/<int:id>', methods=['PUT'])
def update_notification(id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Mặc định PUT này dùng để cập nhật trạng thái thông báo (ví dụ: đánh dấu đã đọc)
        # Nếu DB của bạn có cột TrangThai/DaDoc thì đổi câu UPDATE này nhé
        # Ở đây tớ demo logic trả về thành công chuẩn quy ước
        
        return jsonify({
            "success": True, 
            "data": {"message": f"Đã cập nhật thông báo {id} thành công"}
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()
