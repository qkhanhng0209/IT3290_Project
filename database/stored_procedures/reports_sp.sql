USE QuanLyThuVien
GO

-- Tạo proc thống kê sách theo thể loại
CREATE OR ALTER PROCEDURE sp_ReportBooksByCategory
AS 
BEGIN
	SET NOCOUNT ON;

	SELECT
		tl.TenTheLoai,
		COUNT(DISTINCT ds.ISBN) AS SoLuongDauSach,
		COUNT(cs.MaSach) AS TongSoCuon
	FROM TheLoai tl
	LEFT JOIN TheLoai_DauSach tlds on tl.MaTheLoai = tlds.MaTheLoai
	LEFT JOIN DauSach ds on tlds.ISBN = ds.ISBN
	LEFT JOIN CuonSach cs on ds.ISBN = cs.ISBN
	GROUP BY tl.TenTheLoai
	ORDER BY TongSoCuon DESC, SoLuongDauSach DESC, tl.TenTheLoai;
END 
GO

-- Tạo proc thống kê sách theo nhà xuất bản
CREATE OR ALTER PROCEDURE sp_ReportBooksByPublisher
AS BEGIN
	SET NOCOUNT ON;

	SELECT
		nxb.TenNXB,
		COUNT(DISTINCT ds.ISBN) AS SoLuongDauSach,
		COUNT(cs.MaSach) AS TongSoCuon
	FROM NXB nxb
	LEFT JOIN DauSach ds ON nxb.MaSoNXB = ds.MaSoNXB
	LEFT JOIN CuonSach cs ON ds.ISBN = cs.ISBN
	GROUP BY nxb.TenNXB
	ORDER BY TongSoCuon DESC, SoLuongDauSach DESC, nxb.TenNXB;
END
GO

CREATE OR ALTER PROCEDURE sp_ReportBooksByAuthor
AS 
BEGIN
	SET NOCOUNT ON;

	SELECT
		tg.TenTacGia,
		COUNT(DISTINCT ds.ISBN) AS SoLuongDauSach,
		COUNT(cs.MaSach) AS TongSoCuon
	FROM TacGia tg
	LEFT JOIN TacGia_DauSach tgds on tg.MaSoTG = tgds.MaSoTG
	LEFT JOIN DauSach ds on tgds.ISBN = ds.ISBN
	LEFT JOIN CuonSach cs on ds.ISBN = cs.ISBN
	GROUP BY tg.TenTacGia
	ORDER BY TongSoCuon DESC, SoLuongDauSach DESC, tg.TenTacGia;
END
GO

-- Tạo proc thống kê sách theo tình trạng
CREATE OR ALTER PROCEDURE sp_ReportInventory
AS 
BEGIN
	SET NOCOUNT ON;
	SELECT
		ds.ISBN,
		ds.TenSach,
		COUNT(cs.MaSach) AS TongSoCuon,

		SUM(CASE
				WHEN cs.TinhTrang = N'Tot'
				THEN 1
				ELSE 0
			END) AS SoCuonTot,

		SUM(CASE
				WHEN cs.TinhTrang = N'DangMuon'
				THEN 1
				ELSE 0
			END) AS SoCuonDangMuon,

		SUM(CASE
				WHEN cs.TinhTrang = N'HongNhe'
				THEN 1
				ELSE 0
			END) AS SoCuonHongNhe,

		SUM(CASE
				WHEN cs.TinhTrang = N'HongNang'
				THEN 1
				ELSE 0
			END) AS SoCuonHongNang,

		SUM(CASE
				WHEN cs.TinhTrang = N'Mat'
				THEN 1
				ELSE 0
			END) AS SoCuonMat

	FROM DauSach ds
	LEFT JOIN CuonSach cs ON ds.ISBN = cs.ISBN
	GROUP BY ds.ISBN, ds.TenSach
	ORDER BY ds.TenSach;
END
GO

CREATE OR ALTER PROCEDURE sp_TopBooks
AS
BEGIN
	SET NOCOUNT ON;

	SELECT TOP 10
		ds.ISBN,
		ds.TenSach,
		COUNT(*) AS SoLuotMuon
	FROM ChiTietPhieuMuon ctpm
	JOIN CuonSach cs ON ctpm.MaSach = cs.MaSach
	JOIN DauSach ds ON cs.ISBN = ds.ISBN
	GROUP BY ds.ISBN, ds.TenSach
	ORDER BY SoLuotMuon DESC, ds.TenSach;
END
GO

CREATE OR ALTER PROCEDURE sp_TopReaders
AS
BEGIN
	SET NOCOUNT ON;
	
	SELECT TOP 10
		dg.MaDocGia,
		dg.HoTen,
		COUNT(ctpm.MaSach) AS TongSoSachMuon
	FROM DocGia dg
	JOIN PhieuMuon pm ON dg.MaDocGia = pm.MaDocGia
	JOIN ChiTietPhieuMuon ctpm ON pm.MaPhieuMuon = ctpm.MaPhieuMuon
	GROUP BY dg.MaDocGia, dg.HoTen
	ORDER BY TongSoSachMuon DESC, dg.HoTen;
END
GO