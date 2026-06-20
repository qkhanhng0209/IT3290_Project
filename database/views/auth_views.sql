USE QuanLyThuVien
GO

CREATE VIEW vw_AuthDocGiaLogin
AS
SELECT
    MaDocGia,
    HoTen,
    GioiTinh,
    Email,
    SoDienThoai,
    TrangThaiThe,
    NgayCapThe,
    NgayHetHan,
    TongNo
FROM DocGia;
GO

CREATE VIEW vw_AuthNhanVienLogin
AS
SELECT
    MaNhanVien,
    HoTen,
    Email,
    ChucVu
FROM NhanVien;
GO
