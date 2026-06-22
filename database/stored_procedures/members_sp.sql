USE QuanLyThuVien
GO 

CREATE OR ALTER PROCEDURE sp_GetAllDocGia
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MaDocGia,
        HoTen,
        GioiTinh,
        Email,
        SoDienThoai,
        NgayCapThe,
        NgayHetHan,
        TongNo,
        TrangThaiThe
    FROM DocGia
    ORDER BY MaDocGia DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetDocGiaById
    @MaDocGia INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MaDocGia,
        HoTen,
        GioiTinh,
        Email,
        SoDienThoai,
        NgayCapThe,
        NgayHetHan,
        TongNo,
        TrangThaiThe
    FROM DocGia
    WHERE MaDocGia = @MaDocGia;
END;
GO

CREATE OR ALTER PROCEDURE sp_AddDocGia
    @HoTen NVARCHAR(100),
    @GioiTinh NVARCHAR(10) = NULL,
    @Email VARCHAR(100) = NULL,
    @SoDienThoai VARCHAR(15) = NULL,
    @NgayCapThe DATE = NULL,
    @NgayHetHan DATE = NULL,
    @TrangThaiThe NVARCHAR(20) = N'Hoat Dong'
AS
BEGIN
    SET NOCOUNT ON;

    IF @HoTen IS NULL OR LEN(LTRIM(RTRIM(@HoTen))) = 0
    BEGIN
        RAISERROR(N'Thieu thong tin ho ten!', 16, 1);
        RETURN;
    END

    IF @TrangThaiThe NOT IN (N'Hoat Dong', N'HetHan', N'Bi khoa')
    BEGIN
        RAISERROR(N'Trang thai the khong hop le!', 16, 1);
        RETURN;
    END

    IF @NgayCapThe IS NULL
        SET @NgayCapThe = CAST(GETDATE() AS DATE);

    IF @NgayHetHan IS NULL
        SET @NgayHetHan = DATEADD(year, 1, @NgayCapThe);

    IF @Email IS NOT NULL AND EXISTS (SELECT 1 FROM DocGia WHERE Email = @Email)
    BEGIN
        RAISERROR(N'Email nay da duoc su dung!', 16, 1);
        RETURN;
    END

    IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM DocGia WHERE SoDienThoai = @SoDienThoai)
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
        '',
        @HoTen,
        @GioiTinh,
        @Email,
        @SoDienThoai,
        @NgayCapThe,
        @NgayHetHan,
        0,
        @TrangThaiThe
    );

    SELECT
        'SUCCESS' AS Status,
        N'Them doc gia thanh cong!' AS Message,
        CONVERT(INT, SCOPE_IDENTITY()) AS MaDocGia;
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateDocGia
    @MaDocGia INT,
    @HoTen NVARCHAR(100),
    @GioiTinh NVARCHAR(10) = NULL,
    @Email VARCHAR(100) = NULL,
    @SoDienThoai VARCHAR(15) = NULL,
    @TrangThaiThe NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Khong tim thay doc gia de cap nhat!', 16, 1);
        RETURN;
    END

    IF @TrangThaiThe NOT IN (N'Hoat Dong', N'HetHan', N'Bi khoa')
    BEGIN
        RAISERROR(N'Trang thai the khong hop le!', 16, 1);
        RETURN;
    END

    IF @Email IS NOT NULL
       AND EXISTS (SELECT 1 FROM DocGia WHERE Email = @Email AND MaDocGia <> @MaDocGia)
    BEGIN
        RAISERROR(N'Email nay da duoc su dung!', 16, 1);
        RETURN;
    END

    IF @SoDienThoai IS NOT NULL
       AND EXISTS (SELECT 1 FROM DocGia WHERE SoDienThoai = @SoDienThoai AND MaDocGia <> @MaDocGia)
    BEGIN
        RAISERROR(N'So dien thoai nay da duoc su dung!', 16, 1);
        RETURN;
    END

    UPDATE DocGia
    SET
        HoTen = @HoTen,
        GioiTinh = @GioiTinh,
        Email = @Email,
        SoDienThoai = @SoDienThoai,
        TrangThaiThe = @TrangThaiThe
    WHERE MaDocGia = @MaDocGia;

    SELECT 'SUCCESS' AS Status, N'Cap nhat thong tin doc gia thanh cong!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetDocGiaInfo
    @MaDocGia INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Khong tim thay doc gia!', 16, 1);
        RETURN;
    END

    SELECT
        MaDocGia,
        HoTen,
        GioiTinh,
        Email,
        SoDienThoai,
        NgayCapThe,
        NgayHetHan,
        TongNo,
        TrangThaiThe
    FROM DocGia
    WHERE MaDocGia = @MaDocGia;
END;
GO

CREATE OR ALTER PROCEDURE sp_ActivateDocGia
    @MaDocGia INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Khong tim thay doc gia!', 16, 1);
        RETURN;
    END

    UPDATE DocGia
    SET
        TrangThaiThe = N'Hoat Dong',
        NgayCapThe = CAST(GETDATE() AS DATE),
        NgayHetHan = DATEADD(year, 1, CAST(GETDATE() AS DATE))
    WHERE MaDocGia = @MaDocGia;

    SELECT 'SUCCESS' AS Status, N'Da kich hoat the doc gia thanh cong!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_DeleteDocGia
    @MaDocGia INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Khong tim thay doc gia!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia AND TongNo > 0)
    BEGIN
        RAISERROR(N'Khong the xoa doc gia dang no tien phat thu vien.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM PhieuMuon WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Khong the xoa doc gia da co lich su muon sach.', 16, 1);
        RETURN;
    END

    DELETE FROM DocGia WHERE MaDocGia = @MaDocGia;

    SELECT 'SUCCESS' AS Status, N'Xoa thong tin doc gia thanh cong!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_AddNhanVien
    @HoTen NVARCHAR(100),
    @Email VARCHAR(100),
    @ChucVu VARCHAR(20),
    @MatKhau VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @HoTen IS NULL OR LEN(LTRIM(RTRIM(@HoTen))) = 0
    BEGIN
        RAISERROR(N'Thieu thong tin ho ten!', 16, 1);
        RETURN;
    END

    IF @Email IS NULL OR LEN(LTRIM(RTRIM(@Email))) = 0
    BEGIN
        RAISERROR(N'Thieu email!', 16, 1);
        RETURN;
    END

    IF @ChucVu NOT IN (N'NhanVien', N'QuanLy')
    BEGIN
        RAISERROR(N'Chuc vu khong hop le!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM NhanVien WHERE Email = @Email)
    BEGIN
        RAISERROR(N'Email nay da duoc su dung!', 16, 1);
        RETURN;
    END

    IF @MatKhau IS NULL OR LEN(LTRIM(RTRIM(@MatKhau))) = 0
        SET @MatKhau = '123456';

    INSERT INTO NhanVien (MatKhau, HoTen, Email, ChucVu)
    VALUES (@MatKhau, @HoTen, @Email, @ChucVu);

    SELECT
        'SUCCESS' AS Status,
        N'Them nhan vien thanh cong!' AS Message,
        CONVERT(INT, SCOPE_IDENTITY()) AS MaNhanVien;
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateNhanVien
    @MaNhanVien INT,
    @HoTen NVARCHAR(100),
    @Email VARCHAR(100),
    @ChucVu VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVien)
    BEGIN
        RAISERROR(N'Khong tim thay nhan vien!', 16, 1);
        RETURN;
    END

    IF @ChucVu NOT IN (N'NhanVien', N'QuanLy')
    BEGIN
        RAISERROR(N'Chuc vu khong hop le!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM NhanVien WHERE Email = @Email AND MaNhanVien <> @MaNhanVien)
    BEGIN
        RAISERROR(N'Email nay da duoc su dung!', 16, 1);
        RETURN;
    END

    UPDATE NhanVien
    SET HoTen = @HoTen,
        Email = @Email,
        ChucVu = @ChucVu
    WHERE MaNhanVien = @MaNhanVien;

    SELECT 'SUCCESS' AS Status, N'Cap nhat nhan vien thanh cong!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_DeleteNhanVien
    @MaNhanVien INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVien)
    BEGIN
        RAISERROR(N'Khong tim thay nhan vien!', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM PhieuMuon WHERE MaNhanVien = @MaNhanVien)
    BEGIN
        RAISERROR(N'Khong the xoa nhan vien da co lich su muon sach.', 16, 1);
        RETURN;
    END

    DELETE FROM NhanVien WHERE MaNhanVien = @MaNhanVien;

    SELECT 'SUCCESS' AS Status, N'Xoa thong tin nhan vien thanh cong!' AS Message;
END;
GO
USE QuanLyThuVien;
GO

CREATE OR ALTER PROCEDURE sp_GetAllNhanVien
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy ra các thông tin hiển thị lên bảng giao diện
    -- Không SELECT mật khẩu để bảo mật dữ liệu
    SELECT 
        MaNhanVien,
        HoTen,
        Email,
        ChucVu
    FROM 
        NhanVien
    ORDER BY 
        MaNhanVien DESC; -- Sắp xếp nhân viên mới tạo lên đầu (tùy chọn)
END;
GO
GO
CREATE PROCEDURE sp_GetNhanVienById
    @MaNhanVien INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaNhanVien,
        HoTen,
        Email,
        ChucVu
    FROM NhanVien
    WHERE MaNhanVien = @MaNhanVien;
END
GO
