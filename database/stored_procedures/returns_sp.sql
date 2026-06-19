USE QuanLyThuVien
GO

IF OBJECT_ID('dbo.SP_TraSach', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_TraSach
GO

CREATE PROCEDURE dbo.SP_TraSach
    @MaPhieuMuon INT,
    @MaNhanVien INT,
    @DanhSachTraJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF @DanhSachTraJson IS NULL OR ISJSON(@DanhSachTraJson) <> 1
            THROW 50201, N'Danh sach tra sach khong hop le.', 1;

        IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVien)
            THROW 50202, N'Nhan vien nhan tra khong ton tai.', 1;

        DECLARE @RawItems TABLE (
            MaSach INT NULL,
            TinhTrangTra NVARCHAR(50) NULL,
            PhiXuLy DECIMAL(10,2) NULL
        );

        INSERT INTO @RawItems (MaSach, TinhTrangTra, PhiXuLy)
        SELECT MaSach, TinhTrangTra, ISNULL(PhiXuLy, 0)
        FROM OPENJSON(@DanhSachTraJson)
        WITH (
            MaSach INT '$.ma_sach',
            TinhTrangTra NVARCHAR(50) '$.tinh_trang_tra',
            PhiXuLy DECIMAL(10,2) '$.phi_xu_ly'
        );

        IF NOT EXISTS (SELECT 1 FROM @RawItems)
            THROW 50203, N'Can chon it nhat 1 cuon sach de tra.', 1;

        IF EXISTS (
            SELECT 1
            FROM @RawItems
            WHERE MaSach IS NULL
               OR TinhTrangTra NOT IN (N'BinhThuong', N'HongNhe', N'HongNang', N'Mat')
               OR PhiXuLy < 0
        )
            THROW 50204, N'Ma sach, tinh trang tra hoac phi xu ly khong hop le.', 1;

        IF EXISTS (
            SELECT MaSach
            FROM @RawItems
            GROUP BY MaSach
            HAVING COUNT(*) > 1
        )
            THROW 50205, N'Danh sach tra bi trung ma sach.', 1;

        DECLARE @NgayTra DATE = CAST(GETDATE() AS DATE);
        DECLARE @MaDocGia INT;
        DECLARE @TrangThaiPhieu NVARCHAR(50);

        BEGIN TRANSACTION;

        SELECT
            @MaDocGia = MaDocGia,
            @TrangThaiPhieu = TrangThai
        FROM PhieuMuon WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhieuMuon = @MaPhieuMuon;

        IF @MaDocGia IS NULL
            THROW 50206, N'Phieu muon khong ton tai.', 1;

        IF @TrangThaiPhieu <> N'DangMuon'
            THROW 50207, N'Chi co phieu dang muon moi duoc ghi nhan tra sach.', 1;

        IF EXISTS (
            SELECT 1
            FROM @RawItems ri
            LEFT JOIN ChiTietPhieuMuon ct
                ON ct.MaPhieuMuon = @MaPhieuMuon
               AND ct.MaSach = ri.MaSach
            WHERE ct.MaSach IS NULL
        )
            THROW 50208, N'Co ma sach khong thuoc phieu muon nay.', 1;

        IF EXISTS (
            SELECT 1
            FROM @RawItems ri
            INNER JOIN ChiTietPhieuMuon ct
                ON ct.MaPhieuMuon = @MaPhieuMuon
               AND ct.MaSach = ri.MaSach
            WHERE ct.NgayTra IS NOT NULL
        )
            THROW 50209, N'Co sach da duoc tra truoc do.', 1;

        DECLARE @KetQua TABLE (
            MaSach INT PRIMARY KEY,
            HanTra DATE NOT NULL,
            NgayTre INT NOT NULL,
            NgayTinhPhat INT NOT NULL,
            TinhTrangTra NVARCHAR(50) NOT NULL,
            TinhTrangKho NVARCHAR(20) NOT NULL,
            TienPhat DECIMAL(10,2) NOT NULL
        );

        INSERT INTO @KetQua (
            MaSach,
            HanTra,
            NgayTre,
            NgayTinhPhat,
            TinhTrangTra,
            TinhTrangKho,
            TienPhat
        )
        SELECT
            ri.MaSach,
            ct.HanTra,
            CASE
                WHEN DATEDIFF(DAY, ct.HanTra, @NgayTra) > 0
                    THEN DATEDIFF(DAY, ct.HanTra, @NgayTra)
                ELSE 0
            END AS NgayTre,
            CASE
                WHEN DATEDIFF(DAY, ct.HanTra, @NgayTra) > 2
                    THEN DATEDIFF(DAY, ct.HanTra, @NgayTra) - 2
                ELSE 0
            END AS NgayTinhPhat,
            CASE
                WHEN DATEDIFF(DAY, ct.HanTra, @NgayTra) > 30 THEN N'Mat'
                ELSE ri.TinhTrangTra
            END AS TinhTrangTra,
            CASE
                WHEN DATEDIFF(DAY, ct.HanTra, @NgayTra) > 30 THEN N'Mat'
                WHEN ri.TinhTrangTra = N'BinhThuong' THEN N'Tot'
                WHEN ri.TinhTrangTra = N'HongNhe' THEN N'Tot'
                WHEN ri.TinhTrangTra = N'HongNang' THEN N'HongNang'
            ELSE N'Mat'
            END AS TinhTrangKho,
            CASE
                WHEN DATEDIFF(DAY, ct.HanTra, @NgayTra) > 30
                  OR ri.TinhTrangTra IN (N'HongNang', N'Mat')
                    THEN CAST((ds.GiaBia * cs.HeSoDenBu) + ISNULL(ri.PhiXuLy, 0) AS DECIMAL(10,2))
                WHEN DATEDIFF(DAY, ct.HanTra, @NgayTra) > 2
                    THEN CAST(
                        CASE
                            WHEN (DATEDIFF(DAY, ct.HanTra, @NgayTra) - 2) * 2000 > 60000
                                THEN 60000
                            ELSE (DATEDIFF(DAY, ct.HanTra, @NgayTra) - 2) * 2000
                        END AS DECIMAL(10,2)
                    )
                ELSE 0
            END AS TienPhat
        FROM @RawItems ri
        INNER JOIN ChiTietPhieuMuon ct
            ON ct.MaPhieuMuon = @MaPhieuMuon
           AND ct.MaSach = ri.MaSach
        INNER JOIN CuonSach cs ON cs.MaSach = ri.MaSach
        INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN;

        UPDATE ct
        SET
            NgayTra = @NgayTra,
            TinhTrangTra = kq.TinhTrangTra,
            TienPhat = kq.TienPhat
        FROM ChiTietPhieuMuon ct
        INNER JOIN @KetQua kq
            ON kq.MaSach = ct.MaSach
        WHERE ct.MaPhieuMuon = @MaPhieuMuon;

        UPDATE cs
        SET TinhTrang = kq.TinhTrangKho
        FROM CuonSach cs
        INNER JOIN @KetQua kq ON kq.MaSach = cs.MaSach;

        DECLARE @TongTienPhat DECIMAL(10,2) = (
            SELECT ISNULL(SUM(TienPhat), 0) FROM @KetQua
        );

        IF @TongTienPhat > 0
        BEGIN
            UPDATE DocGia
            SET TongNo = TongNo + @TongTienPhat
            WHERE MaDocGia = @MaDocGia;

            INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
            VALUES (
                @MaDocGia,
                N'Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' phat sinh tien phat ' + CAST(@TongTienPhat AS NVARCHAR(30)) + N' VND.',
                N'TienPhat'
            );
        END

        IF EXISTS (SELECT 1 FROM @KetQua WHERE TinhTrangTra = N'HongNhe')
        BEGIN
            INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
            VALUES (
                @MaDocGia,
                N'Thu vien da ghi nhan sach tra bi hong nhe trong phieu #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N'.',
                N'NhacTraSach'
            );
        END

        IF NOT EXISTS (SELECT 1 FROM @KetQua WHERE TinhTrangTra IN (N'HongNhe', N'HongNang', N'Mat'))
        BEGIN
            INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
            VALUES (
                @MaDocGia,
                N'Cam on ban da tra sach. Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' da duoc xac nhan.',
                N'NhacTraSach'
            );
        END

        IF NOT EXISTS (
            SELECT 1
            FROM ChiTietPhieuMuon
            WHERE MaPhieuMuon = @MaPhieuMuon
              AND NgayTra IS NULL
        )
        BEGIN
            UPDATE PhieuMuon
            SET TrangThai = N'HoanThanh'
            WHERE MaPhieuMuon = @MaPhieuMuon;
        END

        DECLARE @CoSachQuaHan30 BIT = 0;

        IF EXISTS (SELECT 1 FROM @KetQua WHERE NgayTre > 30)
            SET @CoSachQuaHan30 = 1;

        IF EXISTS (
            SELECT 1
            FROM PhieuMuon pm
            INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
            WHERE pm.MaDocGia = @MaDocGia
              AND pm.TrangThai = N'DangMuon'
              AND ct.NgayTra IS NULL
              AND DATEDIFF(DAY, ct.HanTra, @NgayTra) > 30
        )
            SET @CoSachQuaHan30 = 1;

        IF EXISTS (
            SELECT 1
            FROM DocGia
            WHERE MaDocGia = @MaDocGia
              AND (TongNo > 100000 OR @CoSachQuaHan30 = 1)
              AND TrangThaiThe <> N'Bi khoa'
        )
        BEGIN
            UPDATE DocGia
            SET TrangThaiThe = N'Bi khoa'
            WHERE MaDocGia = @MaDocGia;

            INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
            VALUES (
                @MaDocGia,
                N'The doc gia da bi khoa do no vuot muc cho phep hoac co sach tre han qua 30 ngay.',
                N'KhoaThe'
            );
        END

        SELECT @TrangThaiPhieu =
            (SELECT TrangThai FROM PhieuMuon WHERE MaPhieuMuon = @MaPhieuMuon);

        COMMIT TRANSACTION;

        SELECT
            @MaPhieuMuon AS MaPhieuMuon,
            @MaDocGia AS MaDocGia,
            @NgayTra AS NgayTra,
            @TongTienPhat AS TongTienPhat,
            @TrangThaiPhieu AS TrangThaiPhieu,
            dg.TongNo,
            dg.TrangThaiThe,
            kq.MaSach,
            ds.ISBN,
            ds.TenSach,
            kq.HanTra,
            kq.NgayTre,
            kq.NgayTinhPhat,
            kq.TinhTrangTra,
            kq.TinhTrangKho,
            kq.TienPhat
        FROM @KetQua kq
        INNER JOIN CuonSach cs ON cs.MaSach = kq.MaSach
        INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
        INNER JOIN DocGia dg ON dg.MaDocGia = @MaDocGia
        ORDER BY kq.MaSach;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END
GO

-- Stored Procedure: Gia hạn sách (cộng thêm 2 ngày)
IF OBJECT_ID('dbo.SP_GiaHanTraSach', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GiaHanTraSach
GO

CREATE PROCEDURE dbo.SP_GiaHanTraSach
    @MaPhieuMuon INT,
    @SoNgayGiaHan INT = 2
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF @SoNgayGiaHan IS NULL OR @SoNgayGiaHan <= 0
            SET @SoNgayGiaHan = 2;

        DECLARE @MaDocGia INT;
        DECLARE @NgayTuGiaHan DATE = CAST(GETDATE() AS DATE);

        BEGIN TRANSACTION;

        SELECT @MaDocGia = MaDocGia
        FROM PhieuMuon WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhieuMuon = @MaPhieuMuon
          AND TrangThai = N'DangMuon';

        IF @MaDocGia IS NULL
            THROW 50301, N'Phieu muon khong ton tai hoac khong dang trong trang thai muon.', 1;

        -- Kiểm tra sách chưa quá hạn
        IF EXISTS (
            SELECT 1
            FROM ChiTietPhieuMuon
            WHERE MaPhieuMuon = @MaPhieuMuon
              AND HanTra < @NgayTuGiaHan
              AND NgayTra IS NULL
        )
            THROW 50302, N'Khong the gia han sach da qua han. Vui long tra sach va thanh toan phat.', 1;

        -- Cập nhật HanTra - cộng thêm số ngày
        UPDATE ChiTietPhieuMuon
        SET HanTra = DATEADD(DAY, @SoNgayGiaHan, HanTra)
        WHERE MaPhieuMuon = @MaPhieuMuon
          AND NgayTra IS NULL;

        -- Gửi thông báo
        INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
        VALUES (
            @MaDocGia,
            N'Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' da duoc gia han them ' + CAST(@SoNgayGiaHan AS NVARCHAR(5)) + N' ngay.',
            N'NhacMuonSach'
        );

        COMMIT TRANSACTION;

        -- Trả về kết quả
        SELECT
            pm.MaPhieuMuon,
            pm.MaDocGia,
            ct.MaSach,
            ds.ISBN,
            ds.TenSach,
            ct.HanTra AS HanTraMoi,
            DATEDIFF(DAY, @NgayTuGiaHan, ct.HanTra) AS SoNgayConLai
        FROM PhieuMuon pm
        INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
        INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
        INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
        WHERE pm.MaPhieuMuon = @MaPhieuMuon
          AND ct.NgayTra IS NULL
        ORDER BY ct.MaSach;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END
GO

-- ========================================================================
-- GET BORROWED BOOKS - Sách chờ trả
-- ========================================================================
IF OBJECT_ID('dbo.sp_GetBorrowedBooks', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetBorrowedBooks
GO

CREATE PROCEDURE dbo.sp_GetBorrowedBooks
    @MaPhieuMuon INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if ticket exists and is in 'DangMuon' status
    SELECT pm.MaPhieuMuon, pm.MaDocGia, dg.HoTen, pm.TrangThai
    FROM PhieuMuon pm
    INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
    WHERE pm.MaPhieuMuon = @MaPhieuMuon;

    -- Get books that haven't been returned yet
    SELECT
        ct.MaSach,
        ds.ISBN,
        ds.TenSach,
        nxb.TenNXB,
        ds.GiaBia,
        cs.HeSoDenBu,
        ct.HanTra,
        DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) AS SoNgayConLai,
        CASE
            WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), ct.HanTra) < 0
            THEN DATEDIFF(DAY, ct.HanTra, CAST(GETDATE() AS DATE))
            ELSE 0
        END AS SoNgayQuaHan
    FROM ChiTietPhieuMuon ct
    INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
    INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
    LEFT JOIN NXB nxb ON nxb.MaSoNXB = ds.MaSoNXB
    WHERE ct.MaPhieuMuon = @MaPhieuMuon AND ct.NgayTra IS NULL
    ORDER BY ct.MaSach;
END
GO

-- ========================================================================
-- GET RETURN LIST - Danh sách sách đã trả
-- ========================================================================
IF OBJECT_ID('dbo.sp_GetReturnList', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetReturnList
GO

CREATE PROCEDURE dbo.sp_GetReturnList
    @Condition NVARCHAR(50) = NULL,
    @MaDocGia INT = NULL,
    @Page INT = 1,
    @PerPage INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @PerPage;

    -- Get total count
    SELECT COUNT(DISTINCT ct.MaSach) AS TotalCount
    FROM ChiTietPhieuMuon ct
    INNER JOIN PhieuMuon pm ON pm.MaPhieuMuon = ct.MaPhieuMuon
    WHERE ct.NgayTra IS NOT NULL
      AND (@Condition IS NULL OR ct.TinhTrangTra = @Condition)
      AND (@MaDocGia IS NULL OR pm.MaDocGia = @MaDocGia);

    -- Get paginated results
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
        CASE
            WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'Bình thường'
            WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Hỏng nhẹ'
            WHEN ct.TinhTrangTra = N'HongNang' THEN N'Hỏng nặng'
            WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
            ELSE N'Chưa xác định'
        END AS TenTinhTrangTra,
        ct.TienPhat,
        nv.HoTen AS TenNhanVienTraSach
    FROM ChiTietPhieuMuon ct
    INNER JOIN PhieuMuon pm ON pm.MaPhieuMuon = ct.MaPhieuMuon
    INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
    INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
    INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
    LEFT JOIN NXB nxb ON nxb.MaSoNXB = ds.MaSoNXB
    LEFT JOIN NhanVien nv ON nv.MaNhanVien = pm.MaNhanVien
    WHERE ct.NgayTra IS NOT NULL
      AND (@Condition IS NULL OR ct.TinhTrangTra = @Condition)
      AND (@MaDocGia IS NULL OR pm.MaDocGia = @MaDocGia)
    ORDER BY ct.NgayTra DESC
    OFFSET @Offset ROWS FETCH NEXT @PerPage ROWS ONLY;
END
GO

-- ========================================================================
-- GET RETURN STATS - Thống kê trả sách
-- ========================================================================
IF OBJECT_ID('dbo.sp_GetReturnStats', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetReturnStats
GO

CREATE PROCEDURE dbo.sp_GetReturnStats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CASE
            WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'BinhThuong'
            WHEN ct.TinhTrangTra = N'HongNhe' THEN N'HongNhe'
            WHEN ct.TinhTrangTra = N'HongNang' THEN N'HongNang'
            WHEN ct.TinhTrangTra = N'Mat' THEN N'Mat'
            ELSE N'ChuaXD'
        END AS TinhTrang,
        COUNT(*) AS SoLuong,
        SUM(ISNULL(ct.TienPhat, 0)) AS TongTienPhat
    FROM ChiTietPhieuMuon ct
    WHERE ct.NgayTra IS NOT NULL
    GROUP BY ct.TinhTrangTra;
END
GO

-- ========================================================================
-- GET RETURN DETAIL - Chi tiết trả sách
-- ========================================================================
IF OBJECT_ID('dbo.sp_GetReturnDetail', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetReturnDetail
GO

CREATE PROCEDURE dbo.sp_GetReturnDetail
    @MaPhieuMuon INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Get borrowing info
    SELECT
        pm.MaPhieuMuon,
        pm.MaDocGia,
        dg.HoTen,
        dg.Email,
        dg.SoDienThoai,
        dg.TongNo,
        pm.NgayMuon,
        pm.TrangThai,
        nv.HoTen AS TenNhanVienTraSach
    FROM PhieuMuon pm
    INNER JOIN DocGia dg ON dg.MaDocGia = pm.MaDocGia
    LEFT JOIN NhanVien nv ON nv.MaNhanVien = pm.MaNhanVien
    WHERE pm.MaPhieuMuon = @MaPhieuMuon;

    -- Get return details
    SELECT
        ct.MaSach,
        ds.ISBN,
        ds.TenSach,
        nxb.TenNXB,
        ct.HanTra,
        ct.NgayTra,
        DATEDIFF(DAY, ct.HanTra, ct.NgayTra) AS SoNgayTre,
        ct.TinhTrangTra,
        CASE
            WHEN ct.TinhTrangTra = N'BinhThuong' THEN N'Bình thường'
            WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Hỏng nhẹ'
            WHEN ct.TinhTrangTra = N'HongNang' THEN N'Hỏng nặng'
            WHEN ct.TinhTrangTra = N'Mat' THEN N'Mất sách'
            ELSE N'Chưa xác định'
        END AS TenTinhTrangTra,
        ct.TienPhat,
        CASE
            WHEN ct.TinhTrangTra IN (N'HongNang', N'Mat') THEN N'Đền bù'
            WHEN DATEDIFF(DAY, ct.HanTra, ct.NgayTra) > 2 THEN N'Phạt trễ hạn'
            WHEN ct.TinhTrangTra = N'HongNhe' THEN N'Ghi nhận hỏng nhẹ'
            ELSE N'Không phạt'
        END AS LyDoTienPhat
    FROM ChiTietPhieuMuon ct
    INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
    INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
    LEFT JOIN NXB nxb ON nxb.MaSoNXB = ds.MaSoNXB
    WHERE ct.MaPhieuMuon = @MaPhieuMuon AND ct.NgayTra IS NOT NULL
    ORDER BY ct.MaSach;
END
GO