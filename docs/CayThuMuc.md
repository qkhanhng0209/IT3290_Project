## Cây Thư Mục Dự Án (Cay_Thu_muc.txt)

```text
IT3290_Project/
├── .gitignore
├── backend/                        # Phần xử lý logic nghiệp vụ (API)
│   ├── app/
│   │   ├── routes/                 # Định nghĩa các tuyến đường API (endpoints)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Đăng nhập, đăng ký, xác thực tài khoản
│   │   │   ├── books.py            # Quản lý sách
│   │   │   ├── borrowing.py        # Quản lý mượn sách
│   │   │   ├── members.py          # Quản lý độc giả/thành viên
│   │   │   ├── reports.py          # Thống kê & báo cáo
│   │   │   ├── returns.py          # Quản lý trả sách
│   │   │   └── violations.py       # Quản lý vi phạm & phạt
│   │   ├── __init__.py
│   │   ├── config.py               # Các cấu hình của ứng dụng backend
│   │   └── database.py             # Kết nối cơ sở dữ liệu
│   ├── requirements.txt            # Danh sách các thư viện Python cần thiết
│   └── run.py                      # File chạy server backend
├── database/                       # Các kịch bản & cấu trúc cơ sở dữ liệu SQL
│   ├── stored_procedured/          # Chứa các Stored Procedures
│   │   ├── auth_sp.sql
│   │   ├── books_sp.sql
│   │   ├── borrowing_sp.sql
│   │   ├── members_sp.sql
│   │   ├── reports_sp.sql
│   │   ├── returns_sp.sql
│   │   └── violations_sp.sql
│   ├── schema.sql                  # Định nghĩa cấu trúc bảng (Schema)
│   └── seed.sql                    # Dữ liệu mẫu khởi tạo ban đầu
├── docs/                           # Tài liệu dự án
│   └── report.md                   # Báo cáo dự án
└── frontend/                       # Giao diện người dùng
    ├── auth/                       # Đăng nhập
    │   ├── login.html
    │   └── login.js
    ├── books/                      # Giao diện quản lý sách
    │   ├── book.html
    │   └── books.js
    ├── borrowing/                  # Giao diện quản lý mượn sách
    │   ├── borrowing.html
    │   └── borrowing.js
    ├── members/                    # Giao diện quản lý thành viên
    │   ├── members.html
    │   └── members.js
    ├── notifications/              # Giao diện hiển thị thông báo
    │   ├── notifications.html
    │   └── notifications.js
    ├── reports/                    # Giao diện báo cáo, thống kê
    │   ├── reports.html
    │   └── reports.js
    ├── returns/                    # Giao diện quản lý trả sách
    │   ├── returns.html
    │   └── returns.js
    ├── shared/                     # Các file CSS/JS và thành phần dùng chung
    │   ├── api.js                  # Gọi API lên server backend
    │   ├── base.css                # Stylesheet cơ sở
    │   └── navbar.html             # Thanh điều hướng dùng chung
    ├── violations/                 # Giao diện quản lý vi phạm
    │   ├── violations.html
    │   └── violations.js
    └── index.html                  # Trang chủ hệ thống
```
