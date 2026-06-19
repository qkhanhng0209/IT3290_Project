CREATE OR ALTER PROCEDURE sp_GetAllDocGia
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaDocGia, HoTen, GioiTinh, Email, SoDienThoai, NgayCapThe, NgayHetHan, TongNo, TrangThaiThe
    FROM DocGia
    ORDER BY NgayCapThe DESC; -- Độc giả mới đăng ký hiện lên đầu
END;
GO

CREATE OR ALTER PROCEDURE sp_GetDocGiaById
    @MaDocGia VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaDocGia, HoTen, GioiTinh, Email, SoDienThoai, NgayCapThe, NgayHetHan, TongNo, TrangThaiThe
    FROM DocGia
    WHERE MaDocGia = @MaDocGia;
END;
GO


CREATE OR ALTER PROCEDURE sp_UpdateDocGia
    @MaDocGia VARCHAR(50),
    @HoTen NVARCHAR(100),
    @GioiTinh NVARCHAR(10),
    @Email VARCHAR(100),
    @SoDienThoai VARCHAR(20),
    @TrangThaiThe NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra xem độc giả có tồn tại không
    IF NOT EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Không tìm thấy độc giả này để cập nhật!', 16, 1);
        RETURN;
    END

    -- Tiến hành cập nhật dữ liệu (Không sửa MatKhau và TongNo ở đây)
    UPDATE DocGia
    SET HoTen = @HoTen,
        GioiTinh = @GioiTinh,
        Email = @Email,
        SoDienThoai = @SoDienThoai,
        TrangThaiThe = @TrangThaiThe
    WHERE MaDocGia = @MaDocGia;

    SELECT 'SUCCESS' AS Status, N'Cập nhật thông tin độc giả thành công!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_ActivateDocGia
    @MaDocGia VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia)
    BEGIN
        RAISERROR(N'Không tìm thấy độc giả!', 16, 1);
        RETURN;
    END

    -- Đổi trạng thái từ 'Chờ kích hoạt' sang 'Hoạt động'
    UPDATE DocGia
    SET TrangThaiThe = N'Hoạt động',
        NgayCapThe = GETDATE(), -- Tính lại ngày cấp thẻ từ lúc được duyệt
        NgayHetHan = DATEADD(year, 1, GETDATE()) -- Gia hạn 1 năm từ ngày duyệt
    WHERE MaDocGia = @MaDocGia;

    SELECT 'SUCCESS' AS Status, N'Đã kích hoạt thẻ độc giả thành công!' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE sp_DeleteDocGia
    @MaDocGia VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Kiểm tra tiền nợ (Dựa trên cột TongNo của bạn)
    IF EXISTS (SELECT 1 FROM DocGia WHERE MaDocGia = @MaDocGia AND TongNo > 0)
    BEGIN
        RAISERROR(N'Không thể xóa! Độc giả này hiện đang nợ tiền phạt thư viện.', 16, 1);
        RETURN;
    END

    DELETE FROM DocGia WHERE MaDocGia = @MaDocGia;

    SELECT 'SUCCESS' AS Status, N'Xóa thông tin độc giả thành công!' AS Message;
END;
GO
