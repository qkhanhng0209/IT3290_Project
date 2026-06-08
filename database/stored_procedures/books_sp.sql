USE QuanLyThuVien
GO

-- Tạo sp GetBooks
CREATE PROCEDURE sp_GetBooks
AS
BEGIN
	SET NOCOUNT ON;

	SELECT *
	FROM vw_BookInfo
	ORDER BY TenSach;
END
GO

CREATE PROCEDURE sp_GetBooksByISBN
	@ISBN VARCHAR(20)
AS
BEGIN
	SET NOCOUNT ON;

	SELECT *
	FROM vw_BookInfo
	WHERE ISBN = @ISBN
END
GO

CREATE OR ALTER PROCEDURE sp_SearchBooks
	@KeyWord NVARCHAR(255),
	@SearchType VARCHAR(20)
AS
BEGIN
	SET NOCOUNT ON;

	IF @SearchType = 'isbn'
	BEGIN 
		SELECT *
		FROM vw_BookInfo
		WHERE ISBN LIKE '%' + @KeyWord + '%'
		ORDER BY TenSach;
	END

	ELSE IF @SearchType = 'title'
	BEGIN
		SELECT *
		FROM vw_BookInfo
		WHERE TenSach LIKE '%' + @KeyWord + '%'
		ORDER BY TenSach;
	END

	ELSE IF @SearchType = 'author'
	BEGIN
		SELECT *
		FROM vw_BookInfo
		WHERE TacGia LIKE '%' + @KeyWord + '%'
		ORDER BY TenSach;
	END

	ELSE IF @SearchType = 'category'
	BEGIN
		SELECT *
		FROM vw_BookInfo
		WHERE TheLoai LIKE '%' + @KeyWord + '%'
		ORDER BY TenSach
	END

	ELSE
	BEGIN
		SELECT *
		FROM vw_BookInfo
		WHERE
			ISBN LIKE '%' + @KeyWord + '%'
            OR TenSach LIKE '%' + @KeyWord + '%'
            OR TacGia LIKE '%' + @KeyWord + '%'
            OR TheLoai LIKE '%' + @KeyWord + '%'
		ORDER BY TenSach;
	END
END
GO

select * from vw_BookInfo
select * from TacGia;

-- SP thêm sách mới vào db
CREATE OR ALTER PROCEDURE sp_AddBook
	@ISBN VARCHAR(20),
	@TenSach NVARCHAR(255),
	@TenNXB NVARCHAR(200),
	@NamXuatBan INT,
	@SoTrang INT,
	@MoTa NVARCHAR(1000),
	@GiaBia DECIMAL(10,2)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @MaSoNXB INT;

	-- Tìm NXB
	SELECT @MaSoNXB = MaSoNXB
	FROM NXB
	WHERE TenNXB = @TenNXB

	-- Nếu chưa có thì tạo NXB mới
	IF @MaSoNXB IS NULL
	BEGIN
		INSERT INTO NXB(TenNXB)
		VALUES (@TenNXB);

		SET @MaSoNXB = SCOPE_IDENTITY();
	END

	--Thêm Đầu sách
	INSERT INTO 
	DauSach(ISBN, MaSoNXB, TenSach, NamXuatBan, SoTrang, MoTa, GiaBia)
	VALUES (@ISBN, @MaSoNXB, @TenSach, @NamXuatBan, @SoTrang, @MoTa, @GiaBia);
END
GO

-- SP thêm Tác giả vào nếu sách mới được thêm là của tác giả chưa có trong db
CREATE OR ALTER PROCEDURE sp_AddAuthorToBook
	@ISBN VARCHAR(20),
	@TenTacGia NVARCHAR(100)
AS 
BEGIN
	SET NOCOUNT ON;

	DECLARE @MaSoTG INT;

	SELECT @MaSoTG = MaSoTG
	FROM TacGia
	WHERE TenTacGia = @TenTacGia

	IF @MaSoTG IS NULL
	BEGIN
		INSERT INTO TacGia(TenTacGia)
		VALUES(@TenTacGia)

		SET @MaSoTG = SCOPE_IDENTITY();
	END

	IF NOT EXISTS (
		SELECT 1
		FROM TacGia_DauSach
		WHERE ISBN = @ISBN AND MaSoTG = @MaSoTG
	)
	BEGIN
		INSERT INTO TacGia_DauSach(MaSoTG, ISBN)
		VALUES(@MaSoTG, @ISBN);
	END
END
GO

-- SP thêm Thể loại nếu thể loại mới được thêm chưa có trong database
CREATE OR ALTER PROCEDURE sp_AddCategoryToBook
	@ISBN VARCHAR(20),
	@TenTheLoai NVARCHAR(100)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @MaTheLoai INT;

	SELECT @MaTheLoai = MaTheLoai
	FROM TheLoai
	WHERE TenTheLoai = @TenTheLoai;

	IF @MaTheLoai IS NULL
	BEGIN
		INSERT INTO TheLoai(TenTheLoai)
		VALUES(@TenTheLoai);

		SET @MaTheLoai = SCOPE_IDENTITY();
	END

	IF NOT EXISTS (
		SELECT 1
		FROM TheLoai_DauSach
		WHERE ISBN = @ISBN AND MaTheLoai = @MaTheLoai
	)
	BEGIN
		INSERT INTO TheLoai_DauSach(ISBN, MaTheLoai)
		VALUES (@ISBN, @MaTheLoai);
	END
END
GO

EXEC sp_AddCategoryToBook '3636-1818-6767', 'Testing';

EXEC sp_AddAuthorToBook '3636-1818-6767', N'Nguyễn Quốc Khánh';
EXEC sp_AddBook '3636-1818-6767', N'Sách Test', 1, 2025, 200, N'Mô tả sách', 100000;

select * from vw_BookInfo
select * from TheLoai
select * from TacGia
select * from TheLoai_DauSach
select * from TacGia_DauSach
select * from NXB
select * from DauSach

exec sp_AddBook '1000-1945-3636', N'Bút ký từ tầng hầm', N'Nhà Xuất Bản Trẻ',
2026, 360, N'Kiệt tác mở đường cho chủ nghĩa hiện sinh của một cây bút bậc thầy', 167000;

exec sp_AddAuthorToBook '1000-1945-3636', N'Fyodor Dostoyevsky';
exec sp_AddCategoryToBook '1000-1945-3636', N'Văn học phương Tây';
exec sp_AddCategoryToBook '1000-1945-3636', N'Văn học kinh điển';
exec sp_AddCategoryToBook '1000-1945-3636', N'Hiện sinh';

exec sp_AddBook '1001-1002-1003', N'Chiến tranh và Hòa bình', N'Nhà Xuất Bản Hội Nhà văn',
2020, 1500, N'Một trong những cuốn tiểu thuyết vĩ đại nhất từng được viết ra', 1236000;

exec sp_AddAuthorToBook '1001-1002-1003', N'Lev Tolstoy';
exec sp_AddCategoryToBook '1001-1002-1003', N'Văn học phương Tây';
exec sp_AddCategoryToBook '1001-1002-1003', N'Văn học kinh điển';
exec sp_AddCategoryToBook '1001-1002-1003', N'Sử thi';

