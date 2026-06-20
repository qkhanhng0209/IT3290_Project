USE QuanLyThuVien
GO

CREATE VIEW vw_DocGiaInfo
AS
SELECT
    MaDocGia,
    HoTen,
    GioiTinh,
    Email,
    SoDienThoai,
    NgayCapThe,
    NgayHetHan,
    TongNo,
    TrangThaiThe,
    CASE
        WHEN TrangThaiThe = N'Hoat Dong' THEN N'Hoạt động'
        WHEN TrangThaiThe = N'HetHan' THEN N'Hết hạn'
        WHEN TrangThaiThe = N'Bi khoa' THEN N'Bị khóa'
        ELSE TrangThaiThe
    END AS TrangThaiText,
    CASE
        WHEN NgayHetHan IS NOT NULL THEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), NgayHetHan)
        ELSE NULL
    END AS SoNgayConLai
FROM DocGia;
GO
