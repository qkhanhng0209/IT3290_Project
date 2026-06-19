CREATE OR ALTER PROCEDURE sp_XuLyViPham
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    -------------------------------------------------------------------
    -- 1. CHUẨN BỊ: LƯU LẠI TIỀN PHẠT CŨ VÀO BẢNG TẠM
    -------------------------------------------------------------------
    SELECT ct.MaPhieuMuon, ct.MaSach, pm.MaDocGia, ct.TienPhat AS OldTienPhat
    INTO #TempTienPhat
    FROM ChiTietPhieuMuon ct
    JOIN PhieuMuon pm ON ct.MaPhieuMuon = pm.MaPhieuMuon
    WHERE ct.NgayTra IS NULL AND ct.HanTra < @Today;

    -------------------------------------------------------------------
    -- 2. TÍNH TIỀN PHẠT (2000đ/ngày, Tối đa 60.000đ)
    -------------------------------------------------------------------
    UPDATE ct
    SET ct.TienPhat = CASE 
                        WHEN DATEDIFF(day, ct.HanTra, @Today) * 2000 > 60000 THEN 60000
                        ELSE DATEDIFF(day, ct.HanTra, @Today) * 2000 
                      END
    FROM ChiTietPhieuMuon ct
    WHERE ct.NgayTra IS NULL 
      AND DATEDIFF(day, ct.HanTra, @Today) > 2 
      AND DATEDIFF(day, ct.HanTra, @Today) <= 30;

    -------------------------------------------------------------------
    -- 3. TRỄ QUÁ 30 NGÀY -> MẤT SÁCH & ĐỀN TIỀN
    -------------------------------------------------------------------
    UPDATE ct
    SET ct.TinhTrangTra = N'Mat',
        ct.TienPhat = ds.GiaBia * cs.HeSoDenBu
    FROM ChiTietPhieuMuon ct
    JOIN CuonSach cs ON ct.MaSach = cs.MaSach
    JOIN DauSach ds ON cs.ISBN = ds.ISBN
    WHERE ct.NgayTra IS NULL AND DATEDIFF(day, ct.HanTra, @Today) > 30;

    UPDATE cs
    SET cs.TinhTrang = N'Mat'
    FROM CuonSach cs
    JOIN ChiTietPhieuMuon ct ON cs.MaSach = ct.MaSach
    WHERE ct.NgayTra IS NULL AND DATEDIFF(day, ct.HanTra, @Today) > 30;

    -------------------------------------------------------------------
    -- 4. CỘNG TIỀN PHẠT VÀO TỔNG NỢ CỦA ĐỘC GIẢ
    -------------------------------------------------------------------
    UPDATE dg
    SET dg.TongNo = dg.TongNo + (ct_new.TienPhat - t.OldTienPhat)
    FROM DocGia dg
    JOIN #TempTienPhat t ON dg.MaDocGia = t.MaDocGia
    JOIN ChiTietPhieuMuon ct_new ON t.MaPhieuMuon = ct_new.MaPhieuMuon AND t.MaSach = ct_new.MaSach
    WHERE ct_new.TienPhat > t.OldTienPhat;

    DROP TABLE #TempTienPhat; -- Xóa bảng tạm

    -------------------------------------------------------------------
    -- 5. KHÓA THẺ NẾU VƯỢT HẠN MỨC HOẶC MẤT SÁCH
    -------------------------------------------------------------------
    UPDATE DocGia
    SET TrangThaiThe = N'Bi khoa'
    WHERE TrangThaiThe != N'Bi khoa'
      AND (
          TongNo > 100000 
          OR MaDocGia IN (
              SELECT pm.MaDocGia 
              FROM PhieuMuon pm 
              JOIN ChiTietPhieuMuon ct ON pm.MaPhieuMuon = ct.MaPhieuMuon 
              WHERE ct.NgayTra IS NULL AND DATEDIFF(day, ct.HanTra, @Today) > 30
          )
      );
END;
GO