# IT3290 Project - Hệ Thống Quản Lý Thư Viện

Project môn Cơ sở dữ liệu, xây dựng hệ thống quản lý thư viện với:

```text
Frontend (HTML/CSS/JavaScript)
        ↓
Flask REST API
        ↓
MS SQL Server
```

Frontend chỉ gọi API thông qua HTTP request. Backend Flask xử lý nghiệp vụ và truy vấn cơ sở dữ liệu. Frontend không truy cập trực tiếp vào database.

---

## 1. Cấu trúc thư mục

```text
IT3290_Project/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── books.py
│   │   │   ├── borrowing.py
│   │   │   ├── members.py
│   │   │   ├── notifications.py
│   │   │   ├── reports.py
│   │   │   ├── returns.py
│   │   │   └── violations.py
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── database.py
│   ├── requirements.txt
│   └── run.py
├── database/
│   ├── functions/
│   ├── seeds/
│   ├── stored_procedures/
│   ├── views/
│   ├── schema.sql
│   └── seed.sql
├── docs/
└── frontend/
    ├── auth/
    ├── books/
    ├── borrowing/
    ├── members/
    ├── notifications/
    ├── reports/
    ├── returns/
    ├── shared/
    └── violations/
```

---

## 2. Cài đặt backend

Di chuyển vào thư mục backend:

```powershell
cd backend
```

Tạo môi trường ảo:

```powershell
python -m venv venv
```

Kích hoạt môi trường ảo trên Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Cài thư viện:

```powershell
pip install -r requirements.txt
```

---

## 3. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend/` dựa trên `.env.example`.

Ví dụ dùng Windows Authentication:

```env
DB_SERVER=localhost
DB_NAME=QuanLyThuVien
DB_USER=
DB_PASSWORD=
SECRET_KEY=nhom4_thuVien_CSDL
FLASK_DEBUG=True
```

Không commit file `.env` lên Git.

Hiện tại `database.py` đang dùng Windows Authentication:

```text
Trusted_Connection=yes
```

Nếu nhóm muốn dùng SQL Server Authentication, cần cập nhật `backend/app/database.py` để đọc thêm `DB_USER` và `DB_PASSWORD`.

---

## 4. Khởi tạo database

Tạo database và bảng bằng SQL Server Management Studio hoặc Azure Data Studio.

Chạy các script theo thứ tự:

```text
1. database/schema.sql
2. database/views/books_views.sql
3. database/functions/books_functions.sql
4. database/stored_procedures/books_sp.sql
5. database/stored_procedures/borrowing_sp.sql
6. database/stored_procedures/returns_sp.sql
7. database/stored_procedures/reports_sp.sql
8. database/stored_procedures/auth_sp.sql
9. database/stored_procedures/members_sp.sql
10. database/stored_procedures/violations_sp.sql
11. database/seeds/seed_books.sql
12. database/seed.sql nếu có dữ liệu seed chung
```

Lưu ý: các file stored procedure chỉ nên chứa lệnh tạo/sửa procedure. Các lệnh test như `SELECT *` hoặc `EXEC ...` nên tách sang file test riêng để tránh tạo dữ liệu ngoài ý muốn.

---

## 5. Chạy backend

Từ thư mục `backend/`:

```powershell
python run.py
```

Mặc định Flask chạy tại:

```text
http://localhost:5000
```

API có prefix:

```text
http://localhost:5000/api
```

---

## 6. Chạy frontend

Frontend hiện là HTML/CSS/JavaScript thuần.

Có thể mở trực tiếp các file `.html` trong thư mục `frontend/`, hoặc dùng extension Live Server của VS Code.

File gọi API chung:

```text
frontend/shared/api.js
```

Base URL frontend cần thống nhất với backend:

```js
const BASE_URL = "http://localhost:5000/api";
```

---

## 7. Chuẩn JSON response

Tất cả API nên trả cùng một format.

Thành công với object:

```json
{
    "success": true,
    "data": {}
}
```

Thành công với danh sách:

```json
{
    "success": true,
    "data": []
}
```

Lỗi:

```json
{
    "success": false,
    "message": "Mô tả lỗi"
}
```

Frontend nên đọc dữ liệu từ `response.data`, không nên giả định API trả thẳng array.

---

## 8. Quy ước API

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile
PUT  /api/auth/profile
```

### Books

```text
GET    /api/books
GET    /api/books/<isbn>
GET    /api/books/search?q=<keyword>&type=<all|isbn|title|author|category>
POST   /api/books
PUT    /api/books/<isbn>
DELETE /api/books/<isbn>
```

### Members

```text
GET    /api/members
GET    /api/members/<id>
POST   /api/members
PUT    /api/members/<id>
DELETE /api/members/<id>
```

### Borrowing

```text
GET  /api/borrowing
GET  /api/borrowing/<id>
POST /api/borrowing
PUT  /api/borrowing/<id>/pickup
```

### Returns

```text
GET /api/returns/<id>
PUT /api/returns/<id>
```

### Violations

```text
GET  /api/violations
POST /api/violations
```

### Notifications

```text
GET /api/notifications
PUT /api/notifications/<id>
```

### Reports

```text
GET /api/reports/books-by-category
GET /api/reports/books-by-publisher
GET /api/reports/books-by-author
GET /api/reports/inventory
GET /api/reports/top-books
GET /api/reports/top-readers
```

---

## 9. Quy ước backend

Tất cả module phải dùng hàm kết nối chung:

```python
from app.database import get_connection
```

Ví dụ:

```python
conn = get_connection()
cursor = conn.cursor()

try:
    cursor.execute(query)
    rows = cursor.fetchall()
finally:
    conn.close()
```

Không tự tạo hàm kết nối database riêng trong từng module.

Mỗi route nên:

- Validate input trước khi gọi stored procedure.
- Dùng parameter binding, không nối chuỗi SQL từ input người dùng.
- Đóng connection trong `finally`.
- Trả JSON theo chuẩn chung.

---

## 10. Phân chia module

Theo tài liệu trong `docs/`:

| Thành viên | Chức năng |
| ---------- | --------- |
| Khánh | Books + Reports |
| Nguyên | Login + Members |
| Cường | Borrowing + Return |
| Thành | Violation + Notifications |

Mỗi thành viên ưu tiên làm trong module được phân công. Nếu sửa module của người khác, cần trao đổi trước để tránh conflict.

---

## 11. Quy tắc Git

Nhánh chính:

```text
main
└── dev
```

Nhánh chức năng:

```text
feature/books
feature/reports
feature/login
feature/members
feature/borrowing
feature/returns
feature/violations
feature/notifications
```

Quy trình:

1. Pull code mới nhất từ `dev`.
2. Tạo hoặc chuyển sang nhánh `feature/...`.
3. Code và test chức năng.
4. Commit rõ nội dung.
5. Push nhánh.
6. Merge vào `dev` sau khi kiểm tra.

Không commit trực tiếp lên `main`.

---

## 12. Quy ước đặt tên

Tên bảng SQL dùng PascalCase:

```text
DocGia
NhanVien
DauSach
CuonSach
PhieuMuon
ThongBao
```

Tên biến Python/JavaScript dùng snake_case cho dữ liệu backend/database:

```python
ma_doc_gia
tong_tien_phat
ngay_muon
```

Tên file JavaScript theo module:

```text
books.js
reports.js
members.js
```

Tên Blueprint:

```python
books_bp
reports_bp
members_bp
auth_bp
```

---

## 13. Checklist trước khi merge

Trước khi merge vào `dev`, kiểm tra:

- Backend không lỗi cú pháp.
- API trả đúng format `{ success, data/message }`.
- Frontend gọi đúng URL API.
- Stored procedure đã được chạy trên database local.
- Không commit `.env`, `venv/`, `__pycache__/`.
- Không để lệnh test hoặc dữ liệu nháp trong file deploy SQL.
- Chức năng demo được trên máy local.
