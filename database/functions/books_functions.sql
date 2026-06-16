USE QuanLyThuVien
GO

-- function trả về số cuốn sách vật lý có thể mượn được
-- không tính các cuốn đang mượn, mất hoặc hỏng nặng
CREATE OR ALTER FUNCTION fn_GetAvailableCopies
(@ISBN VARCHAR(20))
RETURNS INT
AS
BEGIN
	DECLARE @AvailableCopies INT;

	SELECT @AvailableCopies = COUNT(*)
	FROM CuonSach
	WHERE ISBN = @ISBN
	AND TinhTrang NOT IN (
		N'DangMuon',
		N'Mat',
		N'HongNang'
	);

	RETURN ISNULL(@AvailableCopies, 0);
END
GO