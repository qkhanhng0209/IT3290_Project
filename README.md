# Quy Ước Phát Triển Dự Án

## 1. Kiến trúc hệ thống

```text
Frontend (HTML/CSS/JS)
        ↓
Flask REST API
        ↓
MS SQL Server
```

* Frontend chỉ gọi API thông qua HTTP Request.
* Backend Flask xử lý nghiệp vụ và truy vấn cơ sở dữ liệu.
* Không cho phép Frontend truy cập trực tiếp vào Database.

---

## 2. Cấu trúc Backend

```text
backend/
├── app/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── books.py
│   │   ├── borrowing.py
│   │   ├── members.py
│   │   ├── notifications.py
│   │   ├── reports.py
│   │   ├── returns.py
│   │   └── violations.py
│   ├── __init__.py
│   ├── config.py
│   └── database.py
├── requirements.txt
└── run.py
```

Mỗi thành viên chỉ làm việc trên module được phân công.
Cài đặt những thư viện trong file requirements.txt

---

## 3. Quy Ước API

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
GET    /api/books/search
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
POST /api/borrowing
PUT  /api/borrowing/<id>
```

### Returns

```text
GET  /api/returns
POST /api/returns
```

### Violations

```text
GET  /api/violations
POST /api/violations
```

### Notifications

```text
GET  /api/notifications
PUT  /api/notifications/<id>
```

### Reports

```text
GET /api/reports/top-books
GET /api/reports/top-readers
GET /api/reports/overdue-books
GET /api/reports/fines
GET /api/reports/statistics
```

---

## 4. Chuẩn JSON Response

### Thành công

```json
{
    "success": true,
    "data": {}
}
```

### Thành công có danh sách dữ liệu

```json
{
    "success": true,
    "data": []
}
```

### Lỗi

```json
{
    "success": false,
    "message": "Mô tả lỗi"
}
```

---

## 5. Kết Nối Database

Tất cả module phải sử dụng:

```python
from app.database import get_connection
```

Ví dụ:

```python
conn = get_connection()
cursor = conn.cursor()

cursor.execute(query)

conn.close()
```

Không được tự tạo hàm kết nối riêng trong từng module.

---

## 6. Biến Môi Trường

Thông tin kết nối Database được lưu trong file `.env`.

Ví dụ:

```env
DB_SERVER=localhost
DB_NAME=QuanLyThuVien
```

Không commit thông tin tài khoản hoặc mật khẩu Database lên Git.

---

## 7. Quy Tắc Git

### Nhánh chính

```text
main
└── dev
```

### Nhánh chức năng

```text
feature/books
feature/reports
...
có thể đặt tên nhánh khác đi nếu cần fix bug, thay đổi gì đấy, nhưng cần rõ ràng 
```

### Quy trình làm việc

1. Pull code mới nhất từ `dev`.
2. Tạo hoặc cập nhật nhánh `feature/...`.
3. Commit và Push.
4. Merge vào `dev`.
5. Không commit trực tiếp lên `main`.

---

## 8. Quy Ước Đặt Tên

### Tên bảng SQL

```text
DocGia
NhanVien
DauSach
PhieuMuon
ThongBao
```

### Tên biến Python

```python
ma_doc_gia
tong_tien_phat
ngay_muon
```

### Tên file JavaScript

```text
books.js
reports.js
members.js
```

### Tên Blueprint

```python
books_bp
reports_bp
members_bp
auth_bp
```

---

## 9. Nguyên Tắc Chung

* Mỗi chức năng nằm trong module riêng.
* Không sửa code của thành viên khác nếu chưa trao đổi.
* Tất cả API phải trả dữ liệu dạng JSON.
* Luôn đóng kết nối Database sau khi sử dụng.
* Code phải có comment ở các phần xử lý nghiệp vụ quan trọng.
* Kiểm tra chức năng trước khi merge lên nhánh `dev`.
