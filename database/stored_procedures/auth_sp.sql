USE QuanLyThuVien
GO

CREATE OR ALTER PROCEDURE sp_RegisterDocGia
    @MatKhau VARCHAR(100),
    @HoTen NVARCHAR(100),
    @Email VARCHAR(100),
    @SoDienThoai VARCHAR(15),
    @GioiTinh NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @MatKhau IS NULL OR LEN(LTRIM(RTRIM(@MatKhau))) = 0
       OR @HoTen IS NULL OR LEN(LTRIM(RTRIM(@HoTen))) = 0
       OR @Email IS NULL OR LEN(LTRIM(RTRIM(@Email))) = 0
       OR @SoDienThoai IS NULL OR LEN(LTRIM(RTRIM(@SoDienThoai))) = 0
    BEGIN
        RAISERROR(N'Thieu thong tin dang ky!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM DocGia WHERE Email = @Email)
    BEGIN
        RAISERROR(N'Email nay da duoc su dung!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM DocGia WHERE SoDienThoai = @SoDienThoai)
    BEGIN
        RAISERROR(N'So dien thoai nay da duoc su dung!', 16, 1);
        RETURN;
    END

    INSERT INTO DocGia (
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
        @MatKhau,
        @HoTen,
        @GioiTinh,
        @Email,
        @SoDienThoai,
        CAST(GETDATE() AS DATE),
        DATEADD(year, 1, CAST(GETDATE() AS DATE)),
        0,
        N'Hoat Dong'
    );

    SELECT
        'SUCCESS' AS Status,
        N'Dang ky tai khoan thanh cong!' AS Message,
        CONVERT(INT, SCOPE_IDENTITY()) AS MaDocGia;
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginDocGia
    @Username VARCHAR(100),
    @MatKhau VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

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
    WHERE
        MatKhau = @MatKhau
        AND (
            CONVERT(VARCHAR(50), MaDocGia) = @Username
            OR Email = @Username
            OR SoDienThoai = @Username
        );
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginNhanVien
    @Username VARCHAR(100),
    @MatKhau VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MaNhanVien,
        HoTen,
        Email,
        ChucVu
    FROM NhanVien
    WHERE
        MatKhau = @MatKhau
        AND (
            CONVERT(VARCHAR(50), MaNhanVien) = @Username
            OR Email = @Username
        );
END;
GO
