from flask import Blueprint, jsonify, request
from app.database import get_connection  

members_bp = Blueprint('members', __name__, url_prefix='/api/members')

def _auth_check(allowed_roles):
    role = request.headers.get('X-Auth-Role', '')
    if role not in allowed_roles:
        return jsonify({"message": "Khong co quyen truy cap"}), 403
    return None

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


@members_bp.route('/', methods=['POST'])
def add_member():
    err = _auth_check(['manager'])
    if err:
        return err
    data = request.get_json() or {}
    ho_ten = data.get('hoTen')
    gioi_tinh = data.get('gioiTinh')
    email = data.get('email')
    so_dien_thoai = data.get('soDienThoai')
    ngay_cap_the = data.get('ngayCapThe')
    ngay_het_han = data.get('ngayHetHan')
    trang_thai_the = data.get('trangThaiThe', 'Hoat Dong')

    if not ho_ten:
        return jsonify({"message": "Thieu ho ten!"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "EXEC sp_AddDocGia @HoTen=?, @GioiTinh=?, @Email=?, @SoDienThoai=?, @NgayCapThe=?, @NgayHetHan=?, @TrangThaiThe=?",
            (ho_ten, gioi_tinh, email, so_dien_thoai, ngay_cap_the, ngay_het_han, trang_thai_the)
        )
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return jsonify({"message": row[1], "maDocGia": row[2]}), 201

        return jsonify({"message": "Them doc gia that bai!"}), 400
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()


@members_bp.route('/<string:ma_doc_gia>', methods=['PUT'])
def update_member(ma_doc_gia):
    err = _auth_check(['manager', 'employee'])
    if err:
        return err
    data = request.get_json() or {}
    ho_ten = data.get('hoTen')
    gioi_tinh = data.get('gioiTinh')
    email = data.get('email')
    so_dien_thoai = data.get('soDienThoai')
    trang_thai_the = data.get('trangThaiThe')

    if not ho_ten or not trang_thai_the:
        return jsonify({"message": "Thieu thong tin bat buoc!"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "EXEC sp_UpdateDocGia @MaDocGia=?, @HoTen=?, @GioiTinh=?, @Email=?, @SoDienThoai=?, @TrangThaiThe=?",
            (ma_doc_gia, ho_ten, gioi_tinh, email, so_dien_thoai, trang_thai_the)
        )
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return jsonify({"message": row[1]}), 200

        return jsonify({"message": "Cap nhat doc gia that bai!"}), 400
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
    err = _auth_check(['manager'])
    if err:
        return err
    conn = get_connection()
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

@nhanvien_bp.route('/', methods=['POST'], strict_slashes=False)
def add_nhanvien():
    err = _auth_check(['manager'])
    if err:
        return err
    data = request.get_json() or {}
    ho_ten = data.get('hoTen')
    email = data.get('email')
    chuc_vu = data.get('chucVu')
    mat_khau = data.get('matKhau')

    if not ho_ten or not email or not chuc_vu:
        return jsonify({"message": "Thieu thong tin bat buoc!"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "EXEC sp_AddNhanVien @HoTen=?, @Email=?, @ChucVu=?, @MatKhau=?",
            (ho_ten, email, chuc_vu, mat_khau)
        )
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return jsonify({"message": row[1], "maNhanVien": row[2]}), 201

        return jsonify({"message": "Them nhan vien that bai!"}), 400
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

@nhanvien_bp.route('/<int:ma_nhan_vien>', methods=['PUT'], strict_slashes=False)
def update_nhanvien(ma_nhan_vien):
    err = _auth_check(['manager', 'employee'])
    if err:
        return err
    data = request.get_json() or {}
    ho_ten = data.get('hoTen')
    email = data.get('email')
    chuc_vu = data.get('chucVu')

    if not ho_ten or not email or not chuc_vu:
        return jsonify({"message": "Thieu thong tin bat buoc!"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "EXEC sp_UpdateNhanVien @MaNhanVien=?, @HoTen=?, @Email=?, @ChucVu=?",
            (ma_nhan_vien, ho_ten, email, chuc_vu)
        )
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return jsonify({"message": row[1]}), 200

        return jsonify({"message": "Cap nhat nhan vien that bai!"}), 400
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()


@nhanvien_bp.route('/<int:ma_nhan_vien>', methods=['DELETE'], strict_slashes=False)
def delete_nhanvien(ma_nhan_vien):
    err = _auth_check(['manager'])
    if err:
        return err
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("EXEC sp_DeleteNhanVien @MaNhanVien=?", (ma_nhan_vien,))
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return jsonify({"message": row[1]}), 200

        return jsonify({"message": "Xoa nhan vien that bai!"}), 400
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
