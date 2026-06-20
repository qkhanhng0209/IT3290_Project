USE QuanLyThuVien
GO

CREATE OR ALTER FUNCTION fn_GetMemberStatusText
(
    @TrangThaiThe NVARCHAR(20)
)
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @StatusText NVARCHAR(50);

    SET @StatusText =
        CASE @TrangThaiThe
            WHEN N'Hoat Dong' THEN N'Hoạt động'
            WHEN N'HetHan' THEN N'Hết hạn'
            WHEN N'Bi khoa' THEN N'Bị khóa'
            ELSE @TrangThaiThe
        END;

    RETURN @StatusText;
END
GO

CREATE OR ALTER FUNCTION fn_GetExpiredDays
(
    @MaDocGia INT
)
RETURNS INT
AS
BEGIN
    DECLARE @ExpiredDays INT;

    SELECT @ExpiredDays = DATEDIFF(DAY, CAST(GETDATE() AS DATE), NgayHetHan)
    FROM DocGia
    WHERE MaDocGia = @MaDocGia;

    RETURN @ExpiredDays;
END
GO
