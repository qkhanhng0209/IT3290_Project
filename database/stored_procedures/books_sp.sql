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

-- sp cập nhật thông tin sách
CREATE OR ALTER PROCEDURE sp_UpdateBook
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
	WHERE TenNXB = @TenNXB;

	-- Nếu NXB chưa tồn tại thì tạo mới
	IF @MaSoNXB IS NULL
	BEGIN
		INSERT INTO NXB(TenNXB)
		VALUES (@TenNXB)

		SET @MaSoNXB = SCOPE_IDENTITY();
	END

	UPDATE DauSach
	SET
		MaSoNXB = @MaSoNXB,
		TenSach = @TenSach,
		NamXuatBan = @NamXuatBan,
		SoTrang = @SoTrang,
		MoTa = @MoTa,
		GiaBia = @GiaBia
	WHERE ISBN = @ISBN
END
GO

-- sp xóa hết tác giả khỏi 1 cuốn sách, hỗ trợ việc update
CREATE OR ALTER PROCEDURE sp_RemoveAllAuthorsFromBook
	@ISBN VARCHAR(20)
AS
BEGIN
	SET NOCOUNT ON;

	DELETE FROM TacGia_DauSach
	WHERE ISBN = @ISBN
END
GO

-- sp xóa hết thể loại khỏi 1 cuốn sách, hỗ trợ việc update
CREATE OR ALTER PROCEDURE sp_RemoveAllCategoriesFromBook
	@ISBN VARCHAR(20)
AS
BEGIN
	SET NOCOUNT ON;

	DELETE FROM TheLoai_DauSach
	WHERE ISBN = @ISBN
END
GO


CREATE OR ALTER PROCEDURE sp_DeleteBook
	@ISBN VARCHAR(20)
AS
BEGIN
	SET NOCOUNT ON;

	-- Kiểm tra đầu sách có tồn tại hay không
	IF NOT EXISTS (
		SELECT 1
		FROM DauSach
		WHERE ISBN = @ISBN
	)
	BEGIN
		THROW 50001, N'Không tìm thấy sách!', 1;
	END;

	-- Kiểm tra xem còn cuốn sách vật lý nào hay không
	IF EXISTS (
		SELECT 1
		FROM CuonSach
		WHERE ISBN = @ISBN
	)
	BEGIN
		THROW 50002, N'Không thể xóa đầu sách này vì còn các cuốn sách vật lý!', 1;
	END;

	DELETE FROM TacGia_DauSach
	WHERE ISBN = @ISBN;

	DELETE FROM TheLoai_DauSach
	WHERE ISBN = @ISBN;

	DELETE FROM DauSach
	WHERE ISBN = @ISBN;
END
GO