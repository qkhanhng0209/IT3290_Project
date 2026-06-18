USE QuanLyThuVien
GO

-- View: Danh sách tất cả sách đã trả với chi tiết
IF OBJECT_ID('dbo.V_DanhSachSachDaTra', 'V') IS NOT NULL
    DROP VIEW dbo.V_DanhSachSachDaTra
GO

CREATE VIEW dbo.V_DanhSachSachDaTra
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    dg.SoDienThoai,
    ct.MaSach,
    ds.ISBN,
    ds.TenSach,
    ds.GiaBia,
    nxb.TenNXB,
    pm.NgayMuon,
    ct.HanTra,
    ct.NgayTra,
    DATEDIFF(DAY, ct.HanTra, ct.NgayTra) AS SoNgayTre,
    ct.TinhTrangTra,
    cs.HeSoDenBu,
    ct.TienPhat,
    pm.TrangThai,
    nv.HoTen AS TenNhanVienTraSach,
    CASE
        WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'Bình thường'
        WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Hư nhẹ'
        WHEN ct.TinhTrangTra = N'HongNang' THEN N'Hư nặng'
        WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
        ELSE N'Chưa xác định'
    END AS TenTinhTrangTra
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
LEFT JOIN NXB nxb ON nxb.MaSoNXB = ds.MaSoNXB
LEFT JOIN NhanVien nv ON nv.MaNhanVien = pm.MaNhanVien
WHERE ct.NgayTra IS NOT NULL
GO

-- View: Chi tiết trả sách với thông tin phạt
IF OBJECT_ID('dbo.V_ChiTietTraSach', 'V') IS NOT NULL
    DROP VIEW dbo.V_ChiTietTraSach
GO

CREATE VIEW dbo.V_ChiTietTraSach
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
    ds.GiaBia,
    cs.HeSoDenBu,
    pm.NgayMuon,
    ct.HanTra,
    ct.NgayTra,
    DATEDIFF(DAY, ct.HanTra, ct.NgayTra) AS SoNgayTre,
    CASE
        WHEN DATEDIFF(DAY, ct.HanTra, ct.NgayTra) > 2
            THEN DATEDIFF(DAY, ct.HanTra, ct.NgayTra) - 2
        ELSE 0
    END AS SoNgayTinhPhat,
    ct.TinhTrangTra,
    CASE
        WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'Bình thường'
        WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Hư nhẹ'
        WHEN ct.TinhTrangTra = N'HongNang' THEN N'Hư nặng'
        WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
        ELSE N'Không xác định'
    END AS TenTinhTrangTra,
    ct.TienPhat,
    CASE
        WHEN ct.TinhTrangTra IN (N'HongNang', N'Mat') THEN N'Đền bù'
        WHEN DATEDIFF(DAY, ct.HanTra, ct.NgayTra) > 2 THEN N'Phạt trễ hạn'
        WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Ghi nhận hư nhẹ'
        ELSE N'Không phạt'
    END AS LyDoTienPhat,
    pm.TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
WHERE ct.NgayTra IS NOT NULL
GO

-- View: Phiếu chưa trả toàn bộ sách (trả từng phần)
IF OBJECT_ID('dbo.V_PhieuTraHangPhan', 'V') IS NOT NULL
    DROP VIEW dbo.V_PhieuTraHangPhan
GO

CREATE VIEW dbo.V_PhieuTraHangPhan
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    COUNT(CASE WHEN ct.NgayTra IS NULL THEN 1 END) AS SoSachChuaTra,
    COUNT(CASE WHEN ct.NgayTra IS NOT NULL THEN 1 END) AS SoSachDaTra,
    COUNT(ct.MaSach) AS TongSoSach,
    SUM(ct.TienPhat) AS TongTienPhat,
    pm.NgayMuon,
    pm.TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
WHERE pm.TrangThai = N'DangMuon'
  AND EXISTS (
      SELECT 1 FROM ChiTietPhieuMuon ct2
      WHERE ct2.MaPhieuMuon = pm.MaPhieuMuon
        AND ct2.NgayTra IS NOT NULL
  )
  AND EXISTS (
      SELECT 1 FROM ChiTietPhieuMuon ct3
      WHERE ct3.MaPhieuMuon = pm.MaPhieuMuon
        AND ct3.NgayTra IS NULL
  )
GROUP BY pm.MaPhieuMuon, pm.MaDocGia, dg.HoTen, dg.Email, pm.NgayMuon, pm.TrangThai
GO

-- View: Sách cần trừ nợ độc giả
IF OBJECT_ID('dbo.V_SachCanDenBu', 'V') IS NOT NULL
    DROP VIEW dbo.V_SachCanDenBu
GO

CREATE VIEW dbo.V_SachCanDenBu
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
    ds.GiaBia,
    cs.HeSoDenBu,
    CAST((ds.GiaBia * cs.HeSoDenBu) AS DECIMAL(10,2)) AS SoTienDenBu,
    ct.TinhTrangTra,
    ct.TienPhat,
    ct.NgayTra,
    pm.TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
WHERE ct.NgayTra IS NOT NULL
  AND ct.TinhTrangTra IN (N'HongNang', N'Mat')
  AND ct.TienPhat > 0
GO

-- View: Lịch sử trả sách của một độc giả
IF OBJECT_ID('dbo.V_LichSuTraSachDocGia', 'V') IS NOT NULL
    DROP VIEW dbo.V_LichSuTraSachDocGia
GO

CREATE VIEW dbo.V_LichSuTraSachDocGia
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    ct.MaSach,
    ds.ISBN,
    ds.TenSach,
    pm.NgayMuon,
    ct.HanTra,
    ct.NgayTra,
    DATEDIFF(DAY, ct.HanTra, ct.NgayTra) AS SoNgayTre,
    ct.TinhTrangTra,
    ct.TienPhat,
    pm.TrangThai,
    CASE
        WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'Bình thường'
        WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Hư nhẹ'
        WHEN ct.TinhTrangTra = N'HongNang' THEN N'Hư nặng'
        WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
        ELSE N'Chưa xác định'
    END AS TenTinhTrangTra
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
WHERE ct.NgayTra IS NOT NULL
GO

-- View: Tổng hợp nợ theo độc giả (từ trả sách)
IF OBJECT_ID('dbo.V_TongHopNoDocGia', 'V') IS NOT NULL
    DROP VIEW dbo.V_TongHopNoDocGia
GO

CREATE VIEW dbo.V_TongHopNoDocGia
AS
SELECT
    dg.MaDocGia,
    dg.HoTen,
    dg.Email,
    dg.SoDienThoai,
    dg.TongNo,
    dg.TrangThaiThe,
    COUNT(DISTINCT pm.MaPhieuMuon) AS TongPhieuMuon,
    COUNT(DISTINCT CASE WHEN pm.TrangThai = N'DangMuon' THEN pm.MaPhieuMuon END) AS PhieuDangMuon,
    COUNT(DISTINCT CASE WHEN pm.TrangThai = N'HoanThanh' THEN pm.MaPhieuMuon END) AS PhieuHoanThanh,
    COUNT(DISTINCT CASE WHEN pm.TrangThai = N'DaHuy' THEN pm.MaPhieuMuon END) AS PhieuDaHuy,
    SUM(CASE WHEN ct.NgayTra IS NULL AND pm.TrangThai = N'DangMuon' THEN 1 ELSE 0 END) AS SoSachDangMuon,
    SUM(CASE WHEN ct.TienPhat > 0 AND ct.NgayTra IS NOT NULL THEN ct.TienPhat ELSE 0 END) AS TongTienPhatDaGhi,
    CAST(dg.TongNo AS DECIMAL(10,2)) AS NoConLai
FROM DocGia dg
LEFT JOIN PhieuMuon pm ON pm.MaDocGia = dg.MaDocGia
LEFT JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
GROUP BY dg.MaDocGia, dg.HoTen, dg.Email, dg.SoDienThoai, dg.TongNo, dg.TrangThaiThe
GO

-- View: Danh sách sách được trả hư nặng hoặc mất
IF OBJECT_ID('dbo.V_SachTraHuHoacMat', 'V') IS NOT NULL
    DROP VIEW dbo.V_SachTraHuHoacMat
GO

CREATE VIEW dbo.V_SachTraHuHoacMat
AS
SELECT
    pm.MaPhieuMuon,
    pm.MaDocGia,
    dg.HoTen,
    dg.Email,
    ct.MaSach,
    ds.ISBN,
    ds.TenSach,
    ds.GiaBia,
    cs.HeSoDenBu,
    CAST((ds.GiaBia * cs.HeSoDenBu) AS DECIMAL(10,2)) AS SoTienDenBu,
    ct.TinhTrangTra,
    CASE
        WHEN ct.TinhTrangTra = N'HongNang' THEN N'Hư nặng'
        WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
        ELSE N'Khác'
    END AS TenTinhTrang,
    ct.NgayTra,
    ct.TienPhat,
    pm.TrangThai
FROM PhieuMuon pm
INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
WHERE ct.NgayTra IS NOT NULL
  AND ct.TinhTrangTra IN (N'HongNang', N'Mat')
GO
