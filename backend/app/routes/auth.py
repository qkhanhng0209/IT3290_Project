from flask import Blueprint, request
from app.database import get_connection
from app.response import success, error

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register_reader():
    data = request.get_json() or {}
    mat_khau = data.get('matKhau')
    ho_ten = data.get('hoTen')
    email = data.get('email')
    so_dien_thoai = data.get('soDienThoai')

    if not all([mat_khau, ho_ten, email, so_dien_thoai]):
        return error("Thieu thong tin dang ky", 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "EXEC sp_RegisterDocGia @MatKhau=?, @HoTen=?, @Email=?, @SoDienThoai=?",
            (mat_khau, ho_ten, email, so_dien_thoai)
        )
        row = cursor.fetchone()
        conn.commit()

        if row and row[0] == 'SUCCESS':
            return success(
                data={"maDocGia": row[2]},
                message="Dang ky tai khoan thanh cong!",
                status=201
            )

        return error("Dang ky khong thanh cong", 400)
    except Exception as e:
        error_msg = str(e).split(']')[-1].strip()
        return error(error_msg, 400)
    finally:
        if conn:
            conn.close()


@auth_bp.route('/login-reader', methods=['POST'])
def login_reader():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return error("Thieu tai khoan hoac mat khau", 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("EXEC sp_LoginDocGia @Username=?, @MatKhau=?", (username, password))
        row = cursor.fetchone()

        if not row:
            return error("Ma doc gia, email, so dien thoai hoac mat khau khong chinh xac!", 401)

        columns = [column[0] for column in cursor.description]
        user_info = dict(zip(columns, row))
        return success(data={"role": "reader", "user": user_info})
    except Exception as e:
        return error(str(e), 500)
    finally:
        if conn:
            conn.close()


@auth_bp.route('/login-employee', methods=['POST'])
def login_employee():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return error("Thieu tai khoan hoac mat khau", 400)

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("EXEC sp_LoginNhanVien @Username=?, @MatKhau=?", (username, password))
        row = cursor.fetchone()

        if not row:
            return error("Ma nhan vien, email hoac mat khau khong chinh xac!", 401)

        columns = [column[0] for column in cursor.description]
        employee_info = dict(zip(columns, row))
        return success(data={"role": "employee", "user": employee_info})
    except Exception as e:
        return error(str(e), 500)
    finally:
        if conn:
            conn.close()
