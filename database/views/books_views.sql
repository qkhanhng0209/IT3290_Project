USE QuanLyThuVien
GO

CREATE VIEW vw_BookInfo
AS
SELECT ds.ISBN, ds.TenSach, nxb.TenNXB, ds.NamXuatBan, ds.GiaBia,
	   (
		SELECT COUNT(*)
		FROM CuonSach cs
		WHERE cs.ISBN = ds.ISBN
	   ) AS SoLuong,
	   (
		SELECT STRING_AGG(tg.TenTacGia, ', ')
		FROM TacGia tg
		JOIN TacGia_DauSach tgds ON tg.MaSoTG = tgds.MaSoTG
		WHERE tgds.ISBN = ds.ISBN
	   ) AS TacGia,
	   (
		SELECT STRING_AGG(tl.TenTheLoai, ', ')
		FROM TheLoai tl
		JOIN TheLoai_DauSach tlds ON tl.MaTheLoai = tlds.MaTheLoai
		WHERE tlds.ISBN = ds.ISBN
	   ) AS TheLoai
FROM DauSach ds
LEFT JOIN NXB nxb ON ds.MaSoNXB = nxb.MaSoNXB;
GO
