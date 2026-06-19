CREATE OR ALTER PROCEDURE sp_RegisterDocGia
    @MaDocGia VARCHAR(50),
    @MatKhau VARCHAR(255),
    @HoTen NVARCHAR(100),
    @Email VARCHAR(100),
    @SoDienThoai VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Mã độc giả bị trùng lặp hệ thống, vui lòng thử lại!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM DocGia WHERE Email = @Email)
    BEGIN
        RAISERROR(N'Địa chỉ Email này đã được sử dụng!', 16, 1);
        RETURN;
    END

    INSERT INTO DocGia (
        MaDocGia, 
        MatKhau, 
        HoTen, 
        GioiTinh, 
        Email, 
        SoDienThoai, 
        NgayCapThe, 
        NgayHetHan, 
        TongNo, 
        TrangThaiThe
    )
    VALUES (
        @MaDocGia,
        @MatKhau,
        @HoTen,
        NULL, 
        @Email,
        @SoDienThoai,
        GETDATE(), 
        DATEADD(year, 1, GETDATE()), 
        0,
    );

    SELECT 'SUCCESS' AS Status, N'Đăng ký tài khoản thành công!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginDocGia
    @MaDocGia VARCHAR(50),
    @MatKhau VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra thông tin đăng nhập tài khoản độc giả
    SELECT MaDocGia, HoTen, Email, SoDienThoai, TrangThaiThe, NgayHetHan, TongNo
    FROM DocGia
    WHERE MaDocGia = @MaDocGia 
      AND MatKhau = @MatKhau;
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginNhanVien
    @MaNhanVien VARCHAR(50),
    @MatKhau VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaNhanVien, HoTen, Email, ChucVu
    FROM NhanVien
    WHERE MaNhanVien = @MaNhanVien 
      AND MatKhau = @MatKhau;
END;
GO
