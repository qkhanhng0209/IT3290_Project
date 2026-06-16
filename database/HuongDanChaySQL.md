# Hướng Dẫn Chạy SQL

File này dùng để thống nhất thứ tự khởi tạo database cho cả nhóm.

Nên chạy bằng SQL Server Management Studio hoặc Azure Data Studio. Mỗi file `.sql` nên chạy xong và kiểm tra không lỗi trước khi chuyển sang file tiếp theo.

---

## 1. Tạo database và bảng

Chạy trước:

```text
database/schema.sql
```

File này tạo database `QuanLyThuVien`, các bảng, khóa chính, khóa ngoại, ràng buộc `CHECK`, `UNIQUE` và index cơ bản.

Nếu database đã tồn tại, cần cân nhắc backup hoặc xóa database cũ trước khi chạy lại `schema.sql`.

---

## 2. Tạo view

Chạy sau khi đã có đầy đủ bảng:

```text
database/views/books_views.sql
```

View hiện dùng cho chức năng quản lý sách:

```text
vw_BookInfo
```

---

## 3. Tạo function

Chạy sau khi đã có bảng và view:

```text
database/functions/books_functions.sql
```

Function hiện dùng cho nghiệp vụ sách:

```text
fn_GetAvailableCopies
```

---

## 4. Tạo stored procedure

Chạy các file stored procedure sau khi đã có bảng, view và function.

Thứ tự đề xuất:

```text
database/stored_procedures/books_sp.sql
database/stored_procedures/borrowing_sp.sql
database/stored_procedures/returns_sp.sql
database/stored_procedures/reports_sp.sql
database/stored_procedures/auth_sp.sql
database/stored_procedures/members_sp.sql
database/stored_procedures/violations_sp.sql
```

Ghi chú:

- `books_sp.sql` phụ thuộc vào `vw_BookInfo`.
- `reports_sp.sql` phụ thuộc vào các bảng mượn/trả và dữ liệu sách.
- Một số file có thể đang rỗng nếu module chưa triển khai.

---

## 5. Thêm dữ liệu mẫu

Chạy seed sau khi đã tạo xong bảng và các quan hệ:

```text
database/seeds/seed_books.sql
```

Nếu sau này có seed chung cho nhiều module, thêm vào:

```text
database/seed.sql
```

Hiện tại `database/seed.sql` có thể để trống nếu dữ liệu mẫu đang được tách theo từng file trong thư mục `database/seeds/`.

---

## 6. Thứ tự chạy đầy đủ

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

---

## 7. Quy ước khi sửa SQL

- File deploy chỉ nên chứa lệnh tạo/sửa database object như `CREATE`, `CREATE OR ALTER`, `ALTER`, `DROP` có chủ đích.
- Không để lệnh test như `SELECT *`, `EXEC ...` hoặc dữ liệu nháp trong file deploy.
- Dữ liệu mẫu đặt trong `database/seeds/`.
- Câu lệnh test thủ công nên đặt trong file riêng, ví dụ `database/manual_tests/`.
- Sau khi sửa stored procedure, chạy lại file tương ứng trên database local trước khi commit.

---

## 8. Kiểm tra nhanh sau khi chạy

Có thể kiểm tra các object chính bằng những câu lệnh sau:

```sql
USE QuanLyThuVien;

SELECT COUNT(*) AS SoDauSach FROM DauSach;
SELECT COUNT(*) AS SoCuonSach FROM CuonSach;
SELECT TOP 10 * FROM vw_BookInfo;

EXEC sp_GetBooks;
EXEC sp_ReportInventory;
```

Các câu lệnh kiểm tra này chỉ dùng để test thủ công, không đưa vào file deploy chính.
