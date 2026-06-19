# backend/app/routes/auth.py
from flask import Blueprint, request, jsonify
from app.database import get_connection 

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# --- 1. API ĐĂNG KÝ ĐỘC GIẢ ---
@auth_bp.route('/register', methods=['POST'])
def register_reader():
    data = request.get_json()
    ma_doc_gia = data.get('maDocGia')
    mat_khau = data.get('matKhau')
    ho_ten = data.get('hoTen')
    email = data.get('email')
    so_dien_thoai = data.get('soDienThoai')

    conn = get_connection()  # Đã sửa
    if not conn:
        return jsonify({"message": "Không thể kết nối cơ sở dữ liệu"}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            "EXEC sp_RegisterDocGia @MaDocGia=?, @MatKhau=?, @HoTen=?, @Email=?, @SoDienThoai=?",
            (ma_doc_gia, mat_khau, ho_ten, email, so_dien_thoai)
        )
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return jsonify({
                "status": "success",
                "maDocGia": ma_doc_gia,
                "message": "Đăng ký tài khoản thành công!"
            }), 201
            
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return jsonify({"message": error_msg}), 400
    finally:
        conn.close()

# --- 2. API ĐĂNG NHẬP ĐỘC GIẢ ---
@auth_bp.route('/login-reader', methods=['POST'])
def login_reader():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_connection()  # Đã sửa
    cursor = conn.cursor()
    
    cursor.execute("EXEC sp_LoginDocGia @MaDocGia=?, @MatKhau=?", (username, password))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"message": "Mã độc giả hoặc mật khẩu không chính xác!"}), 401

    columns = [column[0] for column in cursor.description]
    user_info = dict(zip(columns, row))
    
    conn.close()
    return jsonify({"status": "success", "role": "reader", "user": user_info}), 200

# --- 3. API ĐĂNG NHẬP NHÂN VIÊN ---
@auth_bp.route('/login-employee', methods=['POST'])
def login_employee():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_connection()  # Đã sửa
    cursor = conn.cursor()
    
    cursor.execute("EXEC sp_LoginNhanVien @MaNhanVien=?, @MatKhau=?", (username, password))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"message": "Mã nhân viên hoặc mật khẩu không chính xác!"}), 401

    columns = [column[0] for column in cursor.description]
    employee_info = dict(zip(columns, row))
    
    conn.close()
    return jsonify({"status": "success", "role": "employee", "user": employee_info}), 200
