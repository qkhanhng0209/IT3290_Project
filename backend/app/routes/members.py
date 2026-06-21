from flask import Blueprint, jsonify
from app.database import get_connection  

members_bp = Blueprint('members', __name__, url_prefix='/api/members')

@members_bp.route('/', methods=['GET'])
def get_all_members():
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("EXEC sp_GetAllDocGia")
        rows = cursor.fetchall()

        columns = [column[0] for column in cursor.description]
        members_list = []

        for row in rows:
            members_list.append(dict(zip(columns, row)))

        return jsonify(members_list), 200
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()

@members_bp.route('/<string:ma_doc_gia>', methods=['GET'])
def get_member_by_id(ma_doc_gia):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("EXEC sp_GetDocGiaById @MaDocGia=?", (ma_doc_gia,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"message": "Khong tim thay doc gia!"}), 404

        columns = [column[0] for column in cursor.description]
        member = dict(zip(columns, row))

        return jsonify(member), 200

    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()


@members_bp.route('/info/<string:ma_doc_gia>', methods=['GET'])
def get_member_info(ma_doc_gia):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("EXEC sp_GetDocGiaInfo @MaDocGia=?", (ma_doc_gia,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"message": "Khong tim thay doc gia!"}), 404

        columns = [column[0] for column in cursor.description]
        member_info = dict(zip(columns, row))

        return jsonify(member_info), 200

    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()


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


# ==========================================================
# API cho bang NhanVien
# ==========================================================

nhanvien_bp = Blueprint('nhanvien', __name__, url_prefix='/api/nhanvien')

@nhanvien_bp.route('/', methods=['GET'], strict_slashes=False)
def get_all_nhanvien():
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("EXEC sp_GetAllNhanVien")
        rows = cursor.fetchall()
        
        columns = [column[0] for column in cursor.description]
        nhanvien_list = []
        
        for row in rows:
            nhanvien_list.append(dict(zip(columns, row)))
            
        return jsonify(nhanvien_list), 200
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()

@nhanvien_bp.route('/<int:ma_nhan_vien>', methods=['GET'], strict_slashes=False)
def get_nhanvien_by_id(ma_nhan_vien):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("EXEC sp_GetNhanVienById @MaNhanVien=?", (ma_nhan_vien,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"message": "Khong tim thay nhan vien!"}), 404
            
        columns = [column[0] for column in cursor.description]
        nhanvien = dict(zip(columns, row))
        
        return jsonify(nhanvien), 200
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()


@nhanvien_bp.route('/info/<int:ma_nhan_vien>', methods=['GET'], strict_slashes=False)
def get_nhanvien_info(ma_nhan_vien):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("EXEC sp_GetNhanVienInfo @MaNhanVien=?", (ma_nhan_vien,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"message": "Khong tim thay nhan vien!"}), 404
            
        columns = [column[0] for column in cursor.description]
        nhanvien = dict(zip(columns, row))
        
        return jsonify(nhanvien), 200
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()
