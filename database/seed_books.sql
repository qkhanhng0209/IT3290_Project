USE QuanLyThuVien
GO

-- ================================================
-- 1. NXB
-- ================================================
INSERT INTO NXB (TenNXB, SoDienThoai, Email, DiaChi) VALUES
(N'Nhà Xuất Bản Trẻ',           '02838225472', 'nxbtre@nxbtre.com.vn',         N'161B Lý Chính Thắng, Q.3, TP.HCM'),
(N'Nhà Xuất Bản Kim Đồng',      '02438343011', 'nxbkimdong@kimdong.com.vn',    N'55 Quang Trung, Hai Bà Trưng, Hà Nội'),
(N'Nhà Xuất Bản Giáo Dục',      '02438214082', 'nxbgd@nxbgiaoduc.com.vn',      N'81 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội'),
(N'Nhà Xuất Bản Tổng Hợp',      '02838225000', 'nxbtonghop@nxbhcm.com.vn',     N'62 Nguyễn Thị Minh Khai, Q.1, TP.HCM'),
(N'Nhà Xuất Bản Khoa Học',      '02438252731', 'nxbkhoahoc@vast.ac.vn',         N'18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội')
GO

-- ================================================
-- 2. TacGia
-- ================================================
INSERT INTO TacGia (TenTacGia, QuocTich, NgaySinh, MoTa) VALUES
(N'Nguyễn Nhật Ánh',    N'Việt Nam',    '1955-05-07', N'Nhà văn nổi tiếng với các tác phẩm thiếu nhi và tuổi mới lớn'),
(N'Tô Hoài',            N'Việt Nam',    '1920-09-27', N'Nhà văn lớn của văn học Việt Nam hiện đại'),
(N'Nam Cao',            N'Việt Nam',    '1917-10-29', N'Nhà văn hiện thực phê phán xuất sắc'),
(N'Xuân Diệu',          N'Việt Nam',    '1916-02-02', N'Nhà thơ lớn của phong trào Thơ Mới'),
(N'Robert C. Martin',   N'Mỹ',          '1952-12-05', N'Kỹ sư phần mềm, tác giả Clean Code'),
(N'Andrew Hunt',        N'Mỹ',          NULL,          N'Đồng tác giả The Pragmatic Programmer'),
(N'David Thomas',       N'Anh',         NULL,          N'Đồng tác giả The Pragmatic Programmer'),
(N'Dale Carnegie',      N'Mỹ',          '1888-11-24', N'Tác giả sách kỹ năng sống nổi tiếng'),
(N'Yuval Noah Harari',  N'Israel',      '1976-02-24', N'Giáo sư lịch sử, tác giả Sapiens'),
(N'Paulo Coelho',       N'Brazil',      '1947-08-24', N'Nhà văn nổi tiếng thế giới với Nhà Giả Kim')
GO

-- ================================================
-- 3. TheLoai
-- ================================================
INSERT INTO TheLoai (TenTheLoai) VALUES
(N'Văn học Việt Nam'),
(N'Văn học nước ngoài'),
(N'Thiếu nhi'),
(N'Công nghệ thông tin'),
(N'Kỹ năng sống'),
(N'Lịch sử'),
(N'Khoa học'),
(N'Giáo khoa'),
(N'Trinh thám'),
(N'Tâm lý học')
GO

-- ================================================
-- 4. DauSach
-- ================================================
INSERT INTO DauSach (ISBN, MaSoNXB, TenSach, NamXuatBan, SoTrang, MoTa, GiaBia) VALUES
('978-604-1-10001-1', 1, N'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',    2010, 348, N'Câu chuyện tuổi thơ đầy cảm xúc của hai anh em Thiều và Tường',         85000),
('978-604-1-10002-2', 1, N'Mắt Biếc',                            1990, 288, N'Câu chuyện tình yêu trong sáng và đau thương của Ngạn và Hà Lan',        75000),
('978-604-1-10003-3', 1, N'Cho Tôi Xin Một Vé Đi Tuổi Thơ',     2008, 232, N'Hành trình trở về tuổi thơ qua những trò chơi và kỷ niệm',              70000),
('978-604-2-20001-1', 2, N'Dế Mèn Phiêu Lưu Ký',                1941, 176, N'Cuộc phiêu lưu của chú dế mèn dũng cảm qua thế giới loài vật',          55000),
('978-604-3-30001-1', 3, N'Chí Phèo',                            1941, 128, N'Tác phẩm hiện thực phê phán kinh điển của văn học Việt Nam',             45000),
('978-604-4-40001-1', 4, N'Sapiens: Lược Sử Loài Người',         2011, 500, N'Lịch sử loài người từ thời đồ đá đến thế kỷ 21',                       180000),
('978-604-4-40002-2', 4, N'Nhà Giả Kim',                         1988, 224, N'Hành trình theo đuổi giấc mơ của cậu bé chăn cừu Santiago',            95000),
('978-604-4-40003-3', 4, N'Đắc Nhân Tâm',                        1936, 320, N'Nghệ thuật giao tiếp và tạo dựng mối quan hệ',                         110000),
('978-604-5-50001-1', 5, N'Clean Code',                           2008, 431, N'Hướng dẫn viết code sạch và dễ bảo trì',                               320000),
('978-604-5-50002-2', 5, N'The Pragmatic Programmer',             1999, 352, N'Triết lý và kỹ năng thực tiễn cho lập trình viên chuyên nghiệp',        290000)
GO

-- ================================================
-- 5. TacGia_DauSach
-- ================================================
INSERT INTO TacGia_DauSach (MaSoTG, ISBN) VALUES
(1, '978-604-1-10001-1'),   -- Nguyễn Nhật Ánh - Hoa Vàng
(1, '978-604-1-10002-2'),   -- Nguyễn Nhật Ánh - Mắt Biếc
(1, '978-604-1-10003-3'),   -- Nguyễn Nhật Ánh - Tuổi Thơ
(2, '978-604-2-20001-1'),   -- Tô Hoài - Dế Mèn
(3, '978-604-3-30001-1'),   -- Nam Cao - Chí Phèo
(9, '978-604-4-40001-1'),   -- Yuval - Sapiens
(10,'978-604-4-40002-2'),   -- Paulo Coelho - Nhà Giả Kim
(8, '978-604-4-40003-3'),   -- Dale Carnegie - Đắc Nhân Tâm
(5, '978-604-5-50001-1'),   -- Robert Martin - Clean Code
(6, '978-604-5-50002-2'),   -- Andrew Hunt - Pragmatic
(7, '978-604-5-50002-2')    -- David Thomas - Pragmatic
GO

-- ================================================
-- 6. TheLoai_DauSach
-- ================================================
INSERT INTO TheLoai_DauSach (ISBN, MaTheLoai) VALUES
('978-604-1-10001-1', 1),   -- Hoa Vàng - Văn học VN
('978-604-1-10001-1', 3),   -- Hoa Vàng - Thiếu nhi
('978-604-1-10002-2', 1),   -- Mắt Biếc - Văn học VN
('978-604-1-10003-3', 1),   -- Tuổi Thơ - Văn học VN
('978-604-1-10003-3', 3),   -- Tuổi Thơ - Thiếu nhi
('978-604-2-20001-1', 1),   -- Dế Mèn - Văn học VN
('978-604-2-20001-1', 3),   -- Dế Mèn - Thiếu nhi
('978-604-3-30001-1', 1),   -- Chí Phèo - Văn học VN
('978-604-4-40001-1', 6),   -- Sapiens - Lịch sử
('978-604-4-40001-1', 7),   -- Sapiens - Khoa học
('978-604-4-40002-2', 2),   -- Nhà Giả Kim - Văn học NN
('978-604-4-40003-3', 5),   -- Đắc Nhân Tâm - Kỹ năng sống
('978-604-5-50001-1', 4),   -- Clean Code - CNTT
('978-604-5-50002-2', 4)    -- Pragmatic - CNTT
GO

-- ================================================
-- 7. CuonSach (mỗi đầu sách có 3-5 cuốn vật lý)
-- ================================================
INSERT INTO CuonSach (ISBN, TinhTrang, HeSoDenBu) VALUES
-- Tôi Thấy Hoa Vàng (3 cuốn)
('978-604-1-10001-1', N'Tot',       1.2),
('978-604-1-10001-1', N'Tot',       1.2),
('978-604-1-10001-1', N'HongNhe',   1.2),
-- Mắt Biếc (4 cuốn)
('978-604-1-10002-2', N'Tot',       1.2),
('978-604-1-10002-2', N'Tot',       1.2),
('978-604-1-10002-2', N'Tot',       1.2),
('978-604-1-10002-2', N'HongNhe',   1.2),
-- Cho Tôi Xin Một Vé (3 cuốn)
('978-604-1-10003-3', N'Tot',       1.2),
('978-604-1-10003-3', N'Tot',       1.2),
('978-604-1-10003-3', N'Mat',       1.5),
-- Dế Mèn (5 cuốn)
('978-604-2-20001-1', N'Tot',       1.2),
('978-604-2-20001-1', N'Tot',       1.2),
('978-604-2-20001-1', N'Tot',       1.2),
('978-604-2-20001-1', N'HongNhe',   1.2),
('978-604-2-20001-1', N'HongNang',  1.5),
-- Chí Phèo (3 cuốn)
('978-604-3-30001-1', N'Tot',       1.2),
('978-604-3-30001-1', N'Tot',       1.2),
('978-604-3-30001-1', N'HongNhe',   1.2),
-- Sapiens (4 cuốn)
('978-604-4-40001-1', N'Tot',       1.2),
('978-604-4-40001-1', N'Tot',       1.2),
('978-604-4-40001-1', N'Tot',       1.2),
('978-604-4-40001-1', N'HongNhe',   1.2),
-- Nhà Giả Kim (4 cuốn)
('978-604-4-40002-2', N'Tot',       1.2),
('978-604-4-40002-2', N'Tot',       1.2),
('978-604-4-40002-2', N'Tot',       1.2),
('978-604-4-40002-2', N'Tot',       1.2),
-- Đắc Nhân Tâm (3 cuốn)
('978-604-4-40003-3', N'Tot',       1.2),
('978-604-4-40003-3', N'Tot',       1.2),
('978-604-4-40003-3', N'HongNhe',   1.2),
-- Clean Code (3 cuốn)
('978-604-5-50001-1', N'Tot',       1.2),
('978-604-5-50001-1', N'Tot',       1.2),
('978-604-5-50001-1', N'HongNhe',   1.2),
-- The Pragmatic Programmer (3 cuốn)
('978-604-5-50002-2', N'Tot',       1.2),
('978-604-5-50002-2', N'Tot',       1.2),
('978-604-5-50002-2', N'Tot',       1.2)
GO