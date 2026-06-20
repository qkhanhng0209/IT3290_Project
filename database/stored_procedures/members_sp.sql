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
