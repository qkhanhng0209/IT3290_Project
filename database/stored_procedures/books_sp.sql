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