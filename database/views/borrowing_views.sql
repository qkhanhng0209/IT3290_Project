USE QuanLyThuVien
GO

-- View: Danh sách tất cả phiếu mượn với chi tiết sách
IF OBJECT_ID('dbo.V_DanhSachPhieuMuon', 'V') IS NOT NULL
    DROP VIEW dbo.V_DanhSachPhieuMuon
GO

CREATE VIEW dbo.V_DanhSachPhieuMuon
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen AS TenDocGia,
    dg.Email,
    dg.SoDienThoai,
    dg.TongNo,
    dg.TrangThaiThe,
    ct.MaSach,
    cs.ISBN,
    ds.TenSach,
    ds.NamXuatBan,
    nxb.TenNXB,
    pm.NgayTaoPhieu,
    pm.NgayMuon,
    pm.NgayHetHanGiuSach,
    ct.HanTra,
    ct.NgayTra,
    ct.TinhTrangTra,
    DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) AS SoNgayConLai,
    CASE
        WHEN ct.NgayTra IS NOT NULL THEN 0
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) < 0 THEN DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE))
        ELSE 0
    END AS SoNgayQuaHan,
    pm.TrangThai,
    nv.HoTen AS TenNhanVien
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
LEFT JOIN NXB nxb ON nxb.MaSoNXB = ds.MaSoNXB
LEFT JOIN NhanVien nv ON nv.MaNhanVien = pm.MaNhanVien
GO

-- View: Lịch sử mượn trả của một độc giả
IF OBJECT_ID('dbo.V_LichSuMuonTra', 'V') IS NOT NULL
    DROP VIEW dbo.V_LichSuMuonTra
GO

CREATE VIEW dbo.V_LichSuMuonTra
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    ds.ISBN,
    ds.TenSach,
    ct.MaSach,
    pm.NgayTaoPhieu,
    pm.NgayMuon,
    ct.HanTra,
    ct.NgayTra,
    ct.TinhTrangTra,
    ct.TienPhat,
    pm.TrangThai,
    CASE
        WHEN ct.NgayTra IS NULL THEN N'Đang mượn'
        WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'Trả bình thường'
        WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Trả hư nhẹ'
        WHEN ct.TinhTrangTra = N'HongNang' THEN N'Trả hư nặng'
        WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
        ELSE N'Chưa rõ'
    END AS TrangThaiTra
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
GO

-- View: Phiếu sắp hết hạn (< 2 ngày)
IF OBJECT_ID('dbo.V_PhieuSapHetHan', 'V') IS NOT NULL
    DROP VIEW dbo.V_PhieuSapHetHan
GO

CREATE VIEW dbo.V_PhieuSapHetHan
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    dg.SoDienThoai,
    ds.ISBN,
    ds.TenSach,
    ct.MaSach,
    ct.HanTra,
    DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) AS SoNgayConLai,
    pm.NgayMuon,
    pm.TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
WHERE pm.TrangThai = N'DangMuon'
  AND ct.NgayTra IS NULL
  AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) <= 2
  AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) >= 0
GO

-- View: Phiếu quá hạn (trễ hạn)
IF OBJECT_ID('dbo.V_PhieuQuaHan', 'V') IS NOT NULL
    DROP VIEW dbo.V_PhieuQuaHan
GO

CREATE VIEW dbo.V_PhieuQuaHan
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    dg.SoDienThoai,
    dg.TongNo,
    dg.TrangThaiThe,
    ds.ISBN,
    ds.TenSach,
    ds.GiaBia,
    ct.MaSach,
    ct.HanTra,
    DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) AS SoNgayQuaHan,
    CASE
        WHEN DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) > 2 THEN
            CASE
                WHEN (DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) - 2) * 2000 > 60000 THEN 60000
                ELSE (DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) - 2) * 2000
            END
        ELSE 0
    END AS TienPhatTinhToan,
    CASE
        WHEN DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) > 30 THEN N'Sẽ chuyển trạng thái mất'
        WHEN DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) > 2 THEN N'Đang tính phạt'
        ELSE N'Trong thời gian gia hạn'
    END AS TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
WHERE pm.TrangThai = N'DangMuon'
  AND ct.NgayTra IS NULL
  AND DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE)) > 0
GO

-- View: Danh sách phiếu chờ lấy sách
IF OBJECT_ID('dbo.V_PhieuChoLaySach', 'V') IS NOT NULL
    DROP VIEW dbo.V_PhieuChoLaySach
GO

CREATE VIEW dbo.V_PhieuChoLaySach
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    dg.SoDienThoai,
    COUNT(ct.MaSach) AS TongSoCuon,
    pm.NgayTaoPhieu,
    pm.NgayHetHanGiuSach,
    DATEDIFF(DAY, CAST(GETDATE() AS DATE), pm.NgayHetHanGiuSach) AS SoNgayConLai,
    pm.TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
WHERE pm.TrangThai = N'ChoLaySach'
GROUP BY pm.MaPhieuMuon, pm.MaDocGia, dg.HoTen, dg.Email, dg.SoDienThoai, 
         pm.NgayTaoPhieu, pm.NgayHetHanGiuSach, pm.TrangThai
GO

-- View: Chi tiết phiếu mượn (dùng khi xem chi tiết một phiếu)
IF OBJECT_ID('dbo.V_ChiTietPhieuMuon', 'V') IS NOT NULL
    DROP VIEW dbo.V_ChiTietPhieuMuon
GO

CREATE VIEW dbo.V_ChiTietPhieuMuon
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    dg.TongNo,
    dg.TrangThaiThe,
    ct.MaSach,
    ds.ISBN,
    ds.TenSach,
    ds.NamXuatBan,
    ds.GiaBia,
    nxb.TenNXB,
    cs.TinhTrang,
    pm.NgayTaoPhieu,
    pm.NgayMuon,
    pm.NgayHetHanGiuSach,
    ct.HanTra,
    ct.NgayTra,
    ct.TinhTrangTra,
    ct.TienPhat,
    pm.TrangThai,
    nv.HoTen AS TenNhanVien,
    CASE
        WHEN pm.TrangThai = N'ChoLaySach' THEN N'Chờ lấy sách'
        WHEN pm.TrangThai = N'DangMuon' THEN N'Đang mượn'
        WHEN pm.TrangThai = N'HoanThanh' THEN N'Hoàn thành'
        WHEN pm.TrangThai = N'DaHuy' THEN N'Đã hủy'
        ELSE N'Không xác định'
    END AS TenTrangThaiPhieu
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
LEFT JOIN NXB nxb ON nxb.MaSoNXB = ds.MaSoNXB
LEFT JOIN NhanVien nv ON nv.MaNhanVien = pm.MaNhanVien
GO
