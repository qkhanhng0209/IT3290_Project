-- =======================================================
-- FILE: notifications_sp.sql
-- MÔ TẢ: Các Stored Procedure liên quan đến Thông báo
-- =======================================================

USE QuanLyThuVien;
GO

CREATE OR ALTER PROCEDURE sp_TaoThongBao
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Lấy mốc thời gian là ngày hôm nay (Bỏ qua giờ phút giây)
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    -------------------------------------------------------------------
    -- 1. NHẮC TRẢ SÁCH (Trước 2 ngày)
    -------------------------------------------------------------------
    -- Gửi thông báo cho những phiếu mượn chuẩn bị đến hạn
    INSERT INTO ThongBao (MaDocGia, TieuDe, NoiDung, LoaiThongBao)
    SELECT DISTINCT pm.MaDocGia, 
           N'Sắp đến hạn trả sách',
           N'Nhắc nhở: Sách bạn mượn sẽ đến hạn trả vào ngày ' + CONVERT(VARCHAR(10), ct.HanTra, 103) + N'. Vui lòng trả đúng hạn!', 
           N'NhacTraSach'
    FROM ChiTietPhieuMuon ct
    JOIN PhieuMuon pm ON ct.MaPhieuMuon = pm.MaPhieuMuon
    WHERE ct.NgayTra IS NULL AND DATEDIFF(day, @Today, ct.HanTra) = 2;

    -------------------------------------------------------------------
    -- 2. CẢNH BÁO THẺ BỊ KHÓA
    -------------------------------------------------------------------
    -- Gửi cảnh báo cho các thẻ bị khóa (Chỉ gửi 1 lần trong ngày để không bị spam)
    INSERT INTO ThongBao (MaDocGia, TieuDe, NoiDung, LoaiThongBao)
    SELECT MaDocGia, 
           N'Thẻ độc giả đã bị khóa',
           N'Thẻ của bạn đã bị khóa do nợ quá hạn mức hoặc làm mất sách. Vui lòng đến nộp phạt để mở thẻ.', 
           N'KhoaThe'
    FROM DocGia
    WHERE TrangThaiThe = N'Bi khoa' 
      AND MaDocGia NOT IN (
          SELECT MaDocGia FROM ThongBao 
          WHERE LoaiThongBao = N'KhoaThe' AND CAST(NgayGui AS DATE) = @Today
      );

END;
GO