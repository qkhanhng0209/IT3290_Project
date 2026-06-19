from flask import Blueprint, jsonify
from app.database import get_connection  

members_bp = Blueprint('members', __name__, url_prefix='/api/members')

@members_bp.route('/', methods=['GET'])
def get_all_members():
    conn = get_connection()  # Đã sửa
    cursor = conn.cursor()
    
    cursor.execute("EXEC sp_GetAllDocGia")
    rows = cursor.fetchall()
    
    columns = [column[0] for column in cursor.description]
    members_list = []
    
    for row in rows:
        members_list.append(dict(zip(columns, row)))
        
    conn.close()
    return jsonify(members_list), 200

@members_bp.route('/activate/<string:ma_doc_gia>', methods=['PUT'])
def activate_member(ma_doc_gia):
    conn = get_connection()  # Đã sửa
    cursor = conn.cursor()
    
    try:
        cursor.execute("EXEC sp_ActivateDocGia @MaDocGia=?", (ma_doc_gia,))
        row = cursor.fetchone()
        conn.commit()
        
        if row and row[0] == 'SUCCESS':
            return jsonify({"status": "success", "message": "Kích hoạt thẻ độc giả thành công!"}), 200
            
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()
