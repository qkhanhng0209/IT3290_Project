# Workflow Hệ Thống Quản Lý Thư Viện

## 1. Tổng quan

### Độc giả

- Đăng ký
- Đăng nhập
- Chỉnh sửa hồ sơ
- Đặt trước online
- Nhận thông báo
- Xem lịch sử mượn trả

### Nhân viên

- Quản lý kho sách
- Xử lý yêu cầu mượn trả
- Quản lý tài khoản độc giả
- Ghi nhận tình trạng sách
- Lập phiếu thu tiền phạt

### Quản lý

- Thêm sách
- Xóa sách
- Cấp mã độc giả

---

## 2. Quy trình nghiệp vụ

### 2.1 Đăng nhập và quản lý tài khoản

- Độc giả đăng ký thông tin và được cấp mã độc giả.
- Lần đầu đăng nhập có thể sử dụng:
  - Số điện thoại
  - Email
- Các lần sau có thể đăng nhập bằng mã độc giả.
- Hệ thống phân quyền người dùng.

---

### 2.2 Tra cứu, tìm kiếm

Tìm kiếm theo:

- Mã ISBN
- Tên sách
- Tên tác giả
- Thể loại

Kết quả tìm kiếm hiển thị:

- Toàn bộ thông tin đầu sách
- Số lượng sách vật lý còn lại trong kho

---

### 2.3 Quy trình đặt trước và mượn sách

#### Giới hạn mượn

- Tối đa 8 cuốn trong một phiếu mượn.
- Tối đa 40 cuốn mỗi tháng.

#### Khi sách còn trong kho

1. Hệ thống tạo phiếu mượn với trạng thái **"Chờ đến lấy"**.
2. Nhân viên:
   - Nhặt sách trong kho.
   - Đưa vào khu vực chờ lấy.
   - Cập nhật trạng thái sách.
   - Cập nhật số lượng còn lại trong kho.

#### Thời gian giữ sách

- Độc giả có tối đa 3 ngày để đến nhận sách.
- Quá thời hạn:
  - Hệ thống tự động hủy phiếu mượn.
  - Cập nhật lại số lượng sách.
  - Đưa sách trở lại kho.

#### Khi độc giả đến lấy

Nhân viên:

1. Quét mã thẻ độc giả.
2. Quét mã vạch sách.
3. Xác nhận việc nhận sách.

Hệ thống:

- Cập nhật trạng thái sách.
- Chuyển trạng thái phiếu sang **"Đang được mượn"**.
- Bắt đầu tính thời gian mượn.

---

### 2.4 Quy trình trả sách và xử lý hư hỏng, mất mát

Độc giả có thể:

- Trả từng phần.
- Trả toàn bộ một lần.

Khi nhận sách, nhân viên kiểm tra tình trạng vật lý:

#### Sách bình thường

- Ghi nhận trả sách.
- Cập nhật trạng thái.

#### Hư hỏng nhẹ

- Ghi nhận trạng thái **"Hỏng nhẹ"**.
- Tiến hành sửa chữa.
- Gửi thông báo nhắc nhở.

#### Hư hỏng nặng hoặc mất sách

Tiền đền bù:

```text
Giá bìa × Hệ số đền bù + Phí xử lý nghiệp vụ
```

Hệ thống:

- Cập nhật trạng thái sách thành **"Hỏng/Mất"**.
- Loại khỏi kho lưu thông.

---

### 2.5 Quy trình xử lý vi phạm trễ hạn

#### Nhắc nhở

- Trước hạn trả 2 ngày:
  - Hệ thống tự động gửi thông báo.

#### Thời gian gia hạn

- Độc giả có thêm 2 ngày kể từ ngày hết hạn để trả sách.
- Sau thời gian này bắt đầu tính tiền phạt.

#### Công thức phạt

```text
2.000đ / cuốn / ngày trễ
```

Giới hạn:

```text
Tối đa 60.000đ / cuốn
```

#### Quá hạn trên 30 ngày

Hệ thống:

- Chuyển trạng thái sách thành **"Mất"**.
- Không tính phí trễ hạn nữa.
- Áp dụng phí đền bù mất sách.

#### Khóa thẻ tự động

Thẻ bị khóa nếu vi phạm một trong hai điều kiện:

- Tổng tiền nợ > 100.000đ.
- Có sách quá hạn trên 30 ngày.

Trạng thái thẻ:

```text
"Bị khóa"
```

#### Mở khóa thẻ

Độc giả phải:

1. Trả toàn bộ sách quá hạn.
2. Thanh toán toàn bộ tiền phạt.

Sau đó hệ thống sẽ mở khóa và gửi thông báo.

---

# Phân công công việc

## Các chức năng

1. Login
2. Books
3. Members
4. Borrowing
5. Return
6. Violation (phát hiện hư hỏng)
7. Notifications
8. Reports

## Thành viên

| Thành viên | Chức năng                 |
| ---------- | ------------------------- |
| Khánh      | Books + Reports           |
| Nguyên     | Login + Members           |
| Cường      | Borrowing + Return        |
| Thành      | Violation + Notifications |

---

# Quy trình Git

## Cấu trúc nhánh

```text
main
 └── dev
      ├── feature/books
      ├── feature/login
      ├── feature/borrowing
      └── ...
```

### Quy tắc

- Nhánh `dev` được tách từ `main`.
- Merge vào `dev` hằng ngày.
- Mỗi chức năng tạo một nhánh riêng từ `dev`.

Ví dụ:

```text
feature/books
feature/login
feature/members
feature/return
```

### Quy trình làm việc

1. Pull code mới nhất từ `dev`.
2. Code trên nhánh `feature/...`.
3. Commit và push.
4. Merge lên `dev`.

---

# Quy ước đặt tên

## Tên nhánh

```text
feature/...
```

Ví dụ:

```text
feature/books
feature/reports
feature/login
```

## Tên bảng

```text
TenBang
```

Ví dụ:

```text
Sach
DocGia
PhieuMuon
ThongBao
```

## Tên biến

```text
ten_bien_a
```

Ví dụ:

```text
ma_doc_gia
ngay_muon
tong_tien_phat
```

---

# Cập nhật ngày 07/05

## Bảng PhieuMuon

Thêm:

```text
NgayHetHanGiuSach
```

Mục đích:

- Theo dõi thời gian giữ sách.
- Tự động hủy phiếu mượn nếu độc giả không đến nhận.

---

## Bảng ThongBao

Thêm:

### DaDoc

- Kiểm tra độc giả đã đọc thông báo hay chưa.

### LoaiThongBao

Xác định loại thông báo:

- Khóa thẻ
- Nhắc đến nhận sách
- Phạt tiền
- Nhắc trả sách
- Các loại thông báo khác
