USE QuanLyThuVien
GO

CREATE OR ALTER FUNCTION fn_ValidateReaderLogin
(
    @Username VARCHAR(100),
    @MatKhau VARCHAR(100)
)
RETURNS TABLE
AS
RETURN
(
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
    FROM DocGia
    WHERE MatKhau = @MatKhau
      AND (
            CONVERT(VARCHAR(50), MaDocGia) = @Username
            OR Email = @Username
            OR SoDienThoai = @Username
      )
);
GO

CREATE OR ALTER FUNCTION fn_ValidateEmployeeLogin
(
    @Username VARCHAR(100),
    @MatKhau VARCHAR(255)
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        MaNhanVien,
        HoTen,
        Email,
        ChucVu
    FROM NhanVien
    WHERE MatKhau = @MatKhau
      AND (
            CONVERT(VARCHAR(50), MaNhanVien) = @Username
            OR Email = @Username
      )
);
GO
