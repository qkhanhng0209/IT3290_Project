USE QuanLyThuVien
GO

IF OBJECT_ID('dbo.SP_DatTruocSach', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_DatTruocSach
GO

CREATE PROCEDURE dbo.SP_DatTruocSach
    @MaDocGia INT,
    @DanhSachJson NVARCHAR(MAX),
    @SoNgayMuon INT = 14
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF @SoNgayMuon IS NULL OR @SoNgayMuon <= 0
            SET @SoNgayMuon = 14;

        IF @DanhSachJson IS NULL OR ISJSON(@DanhSachJson) <> 1
            THROW 50001, N'Danh sach dat truoc khong hop le.', 1;

        DECLARE @RawItems TABLE (
            ISBN VARCHAR(20) NULL,
            SoLuong INT NULL
        );

        INSERT INTO @RawItems (ISBN, SoLuong)
        SELECT ISBN, SoLuong
        FROM OPENJSON(@DanhSachJson)
        WITH (
            ISBN VARCHAR(20) '$.isbn',
            SoLuong INT '$.so_luong'
        );

        IF NOT EXISTS (SELECT 1 FROM @RawItems)
            THROW 50002, N'Phieu muon phai co it nhat 1 dau sach.', 1;

        IF EXISTS (
            SELECT 1
            FROM @RawItems
            WHERE ISBN IS NULL OR LTRIM(RTRIM(ISBN)) = '' OR SoLuong IS NULL OR SoLuong <= 0
        )
            THROW 50003, N'Moi dong sach phai co ISBN va so luong lon hon 0.', 1;

        DECLARE @DanhSachMuon TABLE (
            ISBN VARCHAR(20) NOT NULL PRIMARY KEY,
            SoLuong INT NOT NULL
        );

        INSERT INTO @DanhSachMuon (ISBN, SoLuong)
        SELECT LTRIM(RTRIM(ISBN)), SUM(SoLuong)
        FROM @RawItems
        GROUP BY LTRIM(RTRIM(ISBN));

        DECLARE @TongSoLuong INT = (SELECT SUM(SoLuong) FROM @DanhSachMuon);

        IF @TongSoLuong > 8
            THROW 50004, N'Moi phieu muon khong duoc qua 8 cuon.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM DocGia dg
            WHERE dg.MaDocGia = @MaDocGia
              AND dg.TrangThaiThe = N'Hoat Dong'
              AND dg.NgayHetHan >= CAST(GETDATE() AS DATE)
              AND dg.TongNo <= 100000
              AND NOT EXISTS (
                  SELECT 1 FROM PhieuMuon pm
                  INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
                  WHERE pm.MaDocGia = @MaDocGia
                    AND pm.TrangThai = N'DangMuon'
                    AND ct.NgayTra IS NULL
                    AND DATEDIFF(DAY, ct.HanTra, GETDATE()) > 30
              )
        )
            THROW 50005, N'Doc gia khong ton tai, the khong hoat dong, het han, dang no qua muc cho phep hoac co sach tre han qua 30 ngay.', 1;

        DECLARE @DauThang DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
        DECLARE @DauThangSau DATE = DATEADD(MONTH, 1, @DauThang);
        DECLARE @SoLuongTrongThang INT = 0;

        SELECT @SoLuongTrongThang = COUNT(*)
        FROM PhieuMuon pm
        INNER JOIN ChiTietPhieuMuon ct
        ON ct.MaPhieuMuon = pm.MaPhieuMuon
        WHERE pm.MaDocGia = @MaDocGia
        AND pm.TrangThai IN (N'DangMuon', N'HoanThanh')
        AND pm.NgayTaoPhieu >= @DauThang
        AND pm.NgayTaoPhieu < @DauThangSau;

        IF @SoLuongTrongThang + @TongSoLuong > 40
        THROW 50006, N'Doc gia vuot gioi han 40 cuon trong thang.', 1;

        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1
            FROM @DanhSachMuon dm
            LEFT JOIN DauSach ds ON ds.ISBN = dm.ISBN
            WHERE ds.ISBN IS NULL
        )
            THROW 50007, N'Co ISBN khong ton tai trong he thong.', 1;

        IF EXISTS (
            SELECT 1
            FROM @DanhSachMuon dm
            CROSS APPLY (
                SELECT COUNT(*) AS SoLuongCoSan
                FROM CuonSach cs WITH (UPDLOCK, HOLDLOCK)
                WHERE cs.ISBN = dm.ISBN
                  AND cs.TinhTrang = N'Tot'
            ) kho
            WHERE kho.SoLuongCoSan < dm.SoLuong
        )
            THROW 50008, N'Khong du so luong sach trong kho de dat truoc.', 1;

        INSERT INTO PhieuMuon (MaDocGia, NgayHetHanGiuSach, TrangThai)
        VALUES (@MaDocGia, DATEADD(DAY, 3, GETDATE()), N'ChoLaySach');

        DECLARE @MaPhieuMuon INT = SCOPE_IDENTITY();

        ;WITH SachCoSan AS (
            SELECT
                cs.MaSach,
                cs.ISBN,
                ROW_NUMBER() OVER (PARTITION BY cs.ISBN ORDER BY cs.MaSach) AS ThuTu
            FROM CuonSach cs WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN @DanhSachMuon dm ON dm.ISBN = cs.ISBN
            WHERE cs.TinhTrang = N'Tot'
        ),
        SachDuocChon AS (
            SELECT scs.MaSach, scs.ISBN
            FROM SachCoSan scs
            INNER JOIN @DanhSachMuon dm ON dm.ISBN = scs.ISBN
            WHERE scs.ThuTu <= dm.SoLuong
        )
        INSERT INTO ChiTietPhieuMuon( MaPhieuMuon, MaSach, HanTra, TienPhat)
        SELECT @MaPhieuMuon, sdc.MaSach, NULL, 0
        FROM SachDuocChon sdc;

        UPDATE cs
        SET TinhTrang = N'DangMuon'
        FROM CuonSach cs
        INNER JOIN ChiTietPhieuMuon ct ON ct.MaSach = cs.MaSach
        WHERE ct.MaPhieuMuon = @MaPhieuMuon;

        INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
        VALUES (
            @MaDocGia,
            N'Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' da duoc tao. Vui long den lay sach trong 3 ngay.',
            N'NhacMuonSach'
        );

        COMMIT TRANSACTION;

        SELECT
            pm.MaPhieuMuon,
            pm.MaDocGia,
            pm.NgayTaoPhieu,
            pm.NgayHetHanGiuSach,
            pm.TrangThai,
            COUNT(ct.MaSach) AS TongSoCuon
        FROM PhieuMuon pm
        INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
        WHERE pm.MaPhieuMuon = @MaPhieuMuon
        GROUP BY pm.MaPhieuMuon, pm.MaDocGia, pm.NgayTaoPhieu, pm.NgayHetHanGiuSach, pm.TrangThai;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.SP_XacNhanLaySach', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_XacNhanLaySach
GO

CREATE PROCEDURE dbo.SP_XacNhanLaySach
    @MaPhieuMuon INT,
    @MaNhanVien INT,
    @SoNgayMuon INT = 14
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF @SoNgayMuon IS NULL OR @SoNgayMuon <= 0
            SET @SoNgayMuon = 14;

        IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVien)
            THROW 50101, N'Nhan vien xac nhan khong ton tai.', 1;

        DECLARE @MaDocGia INT;
        DECLARE @TrangThai NVARCHAR(50);
        DECLARE @NgayHetHanGiuSach DATETIME;

        BEGIN TRANSACTION;

        SELECT
            @MaDocGia = MaDocGia,
            @TrangThai = TrangThai,
            @NgayHetHanGiuSach = NgayHetHanGiuSach
        FROM PhieuMuon WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhieuMuon = @MaPhieuMuon;

        IF @MaDocGia IS NULL
            THROW 50102, N'Phieu muon khong ton tai.', 1;

        IF @TrangThai <> N'ChoLaySach'
            THROW 50103, N'Chi co phieu dang cho lay sach moi duoc xac nhan.', 1;

        IF @NgayHetHanGiuSach < GETDATE()
        BEGIN
            UPDATE cs
            SET TinhTrang = N'Tot'
            FROM CuonSach cs
            INNER JOIN ChiTietPhieuMuon ct ON ct.MaSach = cs.MaSach
            WHERE ct.MaPhieuMuon = @MaPhieuMuon;

            UPDATE PhieuMuon
            SET TrangThai = N'DaHuy'
            WHERE MaPhieuMuon = @MaPhieuMuon;

            INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
            VALUES (
                @MaDocGia,
                N'Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' da bi huy do qua han giu sach.',
                N'HuyPhieu'
            );

            COMMIT TRANSACTION;
            THROW 50104, N'Phieu muon da qua han giu sach va da duoc huy.', 1;
        END

        UPDATE PhieuMuon
        SET
            MaNhanVien = @MaNhanVien,
            NgayMuon = GETDATE(),
            TrangThai = N'DangMuon'
        WHERE MaPhieuMuon = @MaPhieuMuon;

        UPDATE ChiTietPhieuMuon
        SET HanTra = CAST(DATEADD(DAY, @SoNgayMuon, GETDATE()) AS DATE)
        WHERE MaPhieuMuon = @MaPhieuMuon
          AND NgayTra IS NULL;

        INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
        VALUES (
            @MaDocGia,
            N'Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' da duoc xac nhan lay sach.',
            N'NhacMuonSach'
        );

        COMMIT TRANSACTION;

        SELECT
            pm.MaPhieuMuon,
            pm.MaDocGia,
            pm.MaNhanVien,
            pm.NgayMuon,
            pm.TrangThai,
            ct.MaSach,
            ds.ISBN,
            ds.TenSach,
            ct.HanTra
        FROM PhieuMuon pm
        INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
        INNER JOIN CuonSach cs ON cs.MaSach = ct.MaSach
        INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
        WHERE pm.MaPhieuMuon = @MaPhieuMuon
        ORDER BY ct.MaSach;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END
GO

CREATE PROCEDURE SP_TuDongHuyPhieuMuonHetHan
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CancelledList TABLE (
        MaPhieuMuon INT,
        MaDocGia INT
    );

    BEGIN TRANSACTION;

    INSERT INTO @CancelledList (MaPhieuMuon, MaDocGia)
    SELECT DISTINCT pm.MaPhieuMuon, pm.MaDocGia
    FROM PhieuMuon pm
    WHERE pm.TrangThai = N'ChoLaySach'
      AND pm.NgayHetHanGiuSach < GETDATE();

    UPDATE cs
    SET TinhTrang = N'Tot'
    FROM CuonSach cs
    INNER JOIN ChiTietPhieuMuon ct
        ON cs.MaSach = ct.MaSach
    INNER JOIN @CancelledList cl
        ON ct.MaPhieuMuon = cl.MaPhieuMuon;

    UPDATE PhieuMuon
    SET TrangThai = N'DaHuy'
    WHERE TrangThai = N'ChoLaySach'
      AND NgayHetHanGiuSach < GETDATE();

    INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
    SELECT cl.MaDocGia,
           N'Phieu muon #' + CAST(cl.MaPhieuMuon AS NVARCHAR(20)) + N' da bi huy do qua thoi han giu sach.',
           N'HuyPhieu'
    FROM @CancelledList cl;

    COMMIT TRANSACTION;
END
GO

-- Trigger: Nhắc nhở độc giả 2 ngày trước hạn trả sách
IF OBJECT_ID('dbo.TRG_NhacNhoTruocHan', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TRG_NhacNhoTruocHan
GO

CREATE TRIGGER dbo.TRG_NhacNhoTruocHan
ON ChiTietPhieuMuon
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
    SELECT DISTINCT pm.MaDocGia,
           N'Nhac nho: Sach co han tra trong 2 ngay. Phieu muon #' + CAST(pm.MaPhieuMuon AS NVARCHAR(20)),
           N'NhacTraSach'
    FROM inserted i
    INNER JOIN PhieuMuon pm ON pm.MaPhieuMuon = i.MaPhieuMuon
    INNER JOIN CuonSach cs ON cs.MaSach = i.MaSach
    INNER JOIN DauSach ds ON ds.ISBN = cs.ISBN
    WHERE i.HanTra IS NOT NULL
      AND DATEDIFF(DAY, CAST(GETDATE() AS DATE), i.HanTra) = 2
      AND pm.TrangThai = N'DangMuon'
      AND NOT EXISTS (
          SELECT 1 FROM ThongBao tb
          WHERE tb.MaDocGia = pm.MaDocGia
            AND tb.LoaiThongBao = N'NhacTraSach'
            AND tb.NoiDung LIKE N'%#' + CAST(pm.MaPhieuMuon AS NVARCHAR(20)) + N'%'
            AND DATEDIFF(DAY, tb.NgayGui, GETDATE()) = 0
      );
END
GO

-- Stored Procedure: Ghi nhận ghi chú về sách được mượn thành công
IF OBJECT_ID('dbo.SP_GhiNhanMuonThanhCong', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GhiNhanMuonThanhCong
GO

CREATE PROCEDURE dbo.SP_GhiNhanMuonThanhCong
    @MaPhieuMuon INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        DECLARE @MaDocGia INT;
        
        SELECT @MaDocGia = MaDocGia
        FROM PhieuMuon
        WHERE MaPhieuMuon = @MaPhieuMuon
          AND TrangThai = N'DangMuon';

        IF @MaDocGia IS NOT NULL
        BEGIN
            INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
            VALUES (
                @MaDocGia,
                N'Phieu muon #' + CAST(@MaPhieuMuon AS NVARCHAR(20)) + N' da duoc xac nhan. Vui long tra dung han.',
                N'NhacMuonSach'
            );
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- Stored Procedure: Gửi thông báo hàng ngày cho những sách sắp hết hạn (2 ngày nữa)
IF OBJECT_ID('dbo.SP_GuiThongBaoSachSapHetHan', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_GuiThongBaoSachSapHetHan
GO

CREATE PROCEDURE dbo.SP_GuiThongBaoSachSapHetHan
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @HocNay DATE = CAST(GETDATE() AS DATE);
    DECLARE @NgayKiemTra DATE = DATEADD(DAY, 2, @HocNay);

    -- Gửi thông báo cho những sách hết hạn trong 2 ngày nữa
    INSERT INTO ThongBao (MaDocGia, NoiDung, LoaiThongBao)
    SELECT DISTINCT
        pm.MaDocGia,
        N'Nhac nho: Co ' + CAST(COUNT(ct.MaSach) AS NVARCHAR(5)) + N' cuon sach co han tra vao ngay ' + FORMAT(@NgayKiemTra, 'dd/MM/yyyy') + N'. Vui long chuan bi tra dung han.',
        N'NhacTraSach'
    FROM PhieuMuon pm
    INNER JOIN ChiTietPhieuMuon ct ON ct.MaPhieuMuon = pm.MaPhieuMuon
    WHERE pm.TrangThai = N'DangMuon'
      AND ct.NgayTra IS NULL
      AND CAST(ct.HanTra AS DATE) = @NgayKiemTra
      AND NOT EXISTS (
          SELECT 1 FROM ThongBao tb
          WHERE tb.MaDocGia = pm.MaDocGia
            AND tb.LoaiThongBao = N'NhacTraSach'
            AND tb.NoiDung LIKE N'Nhac nho: Co%'
            AND DATEDIFF(DAY, tb.NgayGui, GETDATE()) = 0
      )
    GROUP BY pm.MaDocGia;
END
GO