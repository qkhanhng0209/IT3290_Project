USE QuanLyThuVien
GO

-- ============================================================
-- SEED DATA CHO BORROWING & RETURN
-- ============================================================

-- Chỉnh sửa ngân sách để chèn dữ liệu (nếu cần)
SET IDENTITY_INSERT PhieuMuon ON
GO

-- 1. Thêm phiếu mượn ở trạng thái "ChoLaySach" (Chờ lấy sách)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, NgayTaoPhieu, NgayHetHanGiuSach, TrangThai)
VALUES
    (1, 100001, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 2, GETDATE()), N'ChoLaySach'),
    (2, 100002, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, 1, GETDATE()), N'ChoLaySach'),
    (3, 100003, GETDATE(), DATEADD(DAY, 3, GETDATE()), N'ChoLaySach');
GO

-- 2. Thêm phiếu mượn ở trạng thái "DangMuon" (Đang mượn - bình thường)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, MaNhanVien, NgayTaoPhieu, NgayHetHanGiuSach, NgayMuon, TrangThai)
VALUES
    (4, 100001, 1, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -17, GETDATE()), N'DangMuon'),
    (5, 100002, 1, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -12, GETDATE()), N'DangMuon'),
    (6, 100003, 2, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -7, GETDATE()), N'DangMuon');
GO

-- 3. Thêm phiếu mượn ở trạng thái "DangMuon" (Sắp hết hạn - 2 ngày nữa)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, MaNhanVien, NgayTaoPhieu, NgayHetHanGiuSach, NgayMuon, TrangThai)
VALUES
    (7, 100004, 1, DATEADD(DAY, -12, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -12, GETDATE()), N'DangMuon');
GO

-- 4. Thêm phiếu mượn ở trạng thái "DangMuon" (Quá hạn - 5 ngày)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, MaNhanVien, NgayTaoPhieu, NgayHetHanGiuSach, NgayMuon, TrangThai)
VALUES
    (8, 100005, 2, DATEADD(DAY, -25, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -25, GETDATE()), N'DangMuon');
GO

-- 5. Thêm phiếu mượn ở trạng thái "DangMuon" (Quá hạn > 30 ngày - sẽ chuyển mất)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, MaNhanVien, NgayTaoPhieu, NgayHetHanGiuSach, NgayMuon, TrangThai)
VALUES
    (9, 100006, 1, DATEADD(DAY, -50, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -50, GETDATE()), N'DangMuon');
GO

-- 6. Thêm phiếu mượn ở trạng thái "HoanThanh" (Hoàn thành - trả sách bình thường)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, MaNhanVien, NgayTaoPhieu, NgayHetHanGiuSach, NgayMuon, TrangThai)
VALUES
    (10, 100001, 1, DATEADD(DAY, -25, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -25, GETDATE()), N'HoanThanh'),
    (11, 100002, 2, DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, -30, GETDATE()), N'HoanThanh');
GO

-- 7. Thêm phiếu mượn ở trạng thái "DaHuy" (Đã hủy)
INSERT INTO PhieuMuon (MaPhieuMuon, MaDocGia, NgayTaoPhieu, NgayHetHanGiuSach, TrangThai)
VALUES
    (12, 100003, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -2, GETDATE()), N'DaHuy');
GO

SET IDENTITY_INSERT PhieuMuon OFF
GO

-- ============================================================
-- CHI TIẾT PHIẾU MƯỢN
-- ============================================================

-- Chi tiết phiếu ChoLaySach (phiếu 1, 2, 3)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, TienPhat)
VALUES
    (1, 1, NULL, 0),
    (1, 2, NULL, 0),
    (2, 3, NULL, 0),
    (2, 4, NULL, 0),
    (3, 5, NULL, 0);
GO

-- Chi tiết phiếu DangMuon - Bình thường (phiếu 4, 5, 6)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat)
VALUES
    (4, 6, DATEADD(DAY, 14, DATEADD(DAY, -17, GETDATE())), NULL, NULL, 0),
    (4, 7, DATEADD(DAY, 14, DATEADD(DAY, -17, GETDATE())), NULL, NULL, 0),
    (5, 8, DATEADD(DAY, 14, DATEADD(DAY, -12, GETDATE())), NULL, NULL, 0),
    (5, 9, DATEADD(DAY, 14, DATEADD(DAY, -12, GETDATE())), NULL, NULL, 0),
    (6, 10, DATEADD(DAY, 14, DATEADD(DAY, -7, GETDATE())), NULL, NULL, 0);
GO

-- Chi tiết phiếu sắp hết hạn (phiếu 7 - 2 ngày nữa hết hạn)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat)
VALUES
    (7, 11, DATEADD(DAY, 2, GETDATE()), NULL, NULL, 0),
    (7, 12, DATEADD(DAY, 2, GETDATE()), NULL, NULL, 0);
GO

-- Chi tiết phiếu quá hạn 5 ngày (phiếu 8)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat)
VALUES
    (8, 13, DATEADD(DAY, 14, DATEADD(DAY, -25, GETDATE())), NULL, NULL, 0);
GO

-- Chi tiết phiếu quá hạn > 30 ngày (phiếu 9)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat)
VALUES
    (9, 14, DATEADD(DAY, 14, DATEADD(DAY, -50, GETDATE())), NULL, NULL, 0);
GO

-- Chi tiết phiếu HoanThanh - Trả bình thường (phiếu 10)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat)
VALUES
    (10, 15, DATEADD(DAY, 14, DATEADD(DAY, -25, GETDATE())), DATEADD(DAY, -10, GETDATE()), N'BinhThuong', 0),
    (10, 16, DATEADD(DAY, 14, DATEADD(DAY, -25, GETDATE())), DATEADD(DAY, -10, GETDATE()), N'BinhThuong', 0);
GO

-- Chi tiết phiếu HoanThanh - Trả hư nhẹ (phiếu 11)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat)
VALUES
    (11, 17, DATEADD(DAY, 14, DATEADD(DAY, -30, GETDATE())), DATEADD(DAY, -15, GETDATE()), N'HongNhe', 0);
GO

-- Chi tiết phiếu DaHuy (phiếu 12)
INSERT INTO ChiTietPhieuMuon (MaPhieuMuon, MaSach, HanTra, TienPhat)
VALUES
    (12, 18, NULL, 0),
    (12, 19, NULL, 0);
GO

-- ============================================================
-- UPDATE TRẠNG THÁI SÁCH
-- ============================================================

-- Cập nhật sách ở phiếu ChoLaySach thành DangMuon
UPDATE CuonSach SET TinhTrang = N'DangMuon' WHERE MaSach IN (1, 2, 3, 4, 5);

-- Cập nhật sách ở phiếu DangMuon thành DangMuon
UPDATE CuonSach SET TinhTrang = N'DangMuon' WHERE MaSach IN (6, 7, 8, 9, 10, 11, 12, 13, 14);

-- Cập nhật sách trả bình thường thành Tot
UPDATE CuonSach SET TinhTrang = N'Tot' WHERE MaSach IN (15, 16);

-- Cập nhật sách trả hư nhẹ thành Tot
UPDATE CuonSach SET TinhTrang = N'Tot' WHERE MaSach = 17;

-- Cập nhật sách phiếu hủy thành Tot (vì phiếu bị hủy)
UPDATE CuonSach SET TinhTrang = N'Tot' WHERE MaSach IN (18, 19);

GO

-- ============================================================
-- THÊM THÔNG BÁO
-- ============================================================

INSERT INTO ThongBao (MaDocGia, NgayGui, NoiDung, DaDoc, LoaiThongBao)
VALUES
    (100001, DATEADD(DAY, -1, GETDATE()), N'Phiếu mượn #1 đã được tạo. Vui lòng đến lấy sách trong 3 ngày.', 0, N'NhacMuonSach'),
    (100002, DATEADD(DAY, -2, GETDATE()), N'Phiếu mượn #2 đã được tạo. Vui lòng đến lấy sách trong 3 ngày.', 0, N'NhacMuonSach'),
    (100004, DATEADD(DAY, -2, GETDATE()), N'Nhắc nhở: Có 2 cuốn sách có hạn trả vào ngày ' + FORMAT(DATEADD(DAY, 2, GETDATE()), 'dd/MM/yyyy') + N'. Vui lòng chuẩn bị trả đúng hạn.', 0, N'NhacTraSach'),
    (100005, DATEADD(DAY, -5, GETDATE()), N'Cảnh báo: Bạn có sách trễ hạn 5 ngày. Vui lòng trả sách và thanh toán tiền phạt.', 0, N'NhacTraSach'),
    (100006, DATEADD(DAY, -50, GETDATE()), N'Cảnh báo: Bạn có sách trễ hạn quá 30 ngày. Thẻ của bạn sẽ bị khóa nếu không trả sách.', 0, N'NhacTraSach'),
    (100001, DATEADD(DAY, -10, GETDATE()), N'Cảm ơn bạn đã trả sách. Phiếu mượn #10 đã được xác nhận.', 1, N'NhacTraSach'),
    (100002, DATEADD(DAY, -15, GETDATE()), N'Thư viện đã ghi nhận sách trả bị hư nhẹ trong phiếu #11.', 0, N'NhacTraSach');
GO

-- ============================================================
-- KIỂM TRA DỮ LIỆU
-- ============================================================

PRINT '===== DỮ LIỆU SEED BORROWING ĐÃ ĐƯỢC THÊM ====='
PRINT '';
PRINT 'Danh sách phiếu mươn:'
SELECT MaPhieuMuon, MaDocGia, TrangThai, NgayTaoPhieu FROM PhieuMuon ORDER BY MaPhieuMuon;
PRINT '';
PRINT 'Danh sách chi tiết phiếu mượn:'
SELECT MaPhieuMuon, MaSach, HanTra, NgayTra, TinhTrangTra, TienPhat FROM ChiTietPhieuMuon ORDER BY MaPhieuMuon;
PRINT '';
PRINT 'Danh sách thông báo:'
SELECT MaThongBao, MaDocGia, LoaiThongBao, NgayGui, DaDoc FROM ThongBao ORDER BY MaThongBao DESC;
GO
