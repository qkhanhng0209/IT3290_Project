from flask import Blueprint, request, jsonify
import json
from app.database import get_connection
from app.response import success, error

borrowing_bp = Blueprint("borrowing", __name__)


# ==============================================================
# 1. ĐẶT TRƯỚC SÁCH - Reserve Books
# ==============================================================

@borrowing_bp.route("/api/borrowing/reserve", methods=["POST"])
def reserve_books():
    """
    Đặt trước sách - Create a borrowing request
    
    Request body:
    {
        "ma_doc_gia": 100001,
        "danh_sach_sach": [
            {"isbn": "978-1-234567-89-0", "so_luong": 2},
            {"isbn": "978-1-987654-32-1", "so_luong": 1}
        ],
        "so_ngay_muon": 14
    }
    """
    data = request.get_json()
    
    if not data:
        return error("Dữ liệu gửi lên không hợp lệ", 400)
    
    ma_doc_gia = data.get("ma_doc_gia")
    danh_sach_sach = data.get("danh_sach_sach", [])
    so_ngay_muon = data.get("so_ngay_muon", 14)
    
    if not ma_doc_gia:
        return error("Vui lòng cung cấp mã độc giả", 400)
    
    if not danh_sach_sach or len(danh_sach_sach) == 0:
        return error("Danh sách sách không được trống", 400)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Convert danh_sach_sach to JSON format expected by SQL
        json_list = json.dumps(danh_sach_sach)
        print(f"[DEBUG] reserve_books called: MaDocGia={ma_doc_gia}, SoNgayMuon={so_ngay_muon}, danh_sach_sach={json_list}")

        # Server-side availability pre-check to provide immediate, consistent errors
        # Aggregate quantities per ISBN
        agg = {}
        for it in danh_sach_sach:
            isbn_i = (it.get('isbn') or '').strip()
            qty_i = int(it.get('so_luong') or 0)
            if not isbn_i:
                return error("Mỗi dòng sách phải có ISBN", 400)
            if qty_i <= 0:
                return error("Số lượng phải lớn hơn 0", 400)
            agg[isbn_i] = agg.get(isbn_i, 0) + qty_i

        # Total count limit check (same as SP)
        total_requested = sum(agg.values())
        if total_requested > 8:
            return error("Mỗi phiếu mượn không được quá 8 cuốn", 400)

        # Check availability using same rule as SP (exclude DangMuon, Mat, HongNang)
        for isbn_i, req_qty in agg.items():
            cursor.execute(
                "SELECT COUNT(*) FROM CuonSach WHERE ISBN = ? AND TinhTrang NOT IN (N'DangMuon', N'Mat', N'HongNang')",
                (isbn_i,)
            )
            row_cnt = cursor.fetchone()
            available = int(row_cnt[0]) if row_cnt and row_cnt[0] is not None else 0
            if available < req_qty:
                return error(f"Không đủ số lượng sách trong kho (ISBN {isbn_i}: còn {available})", 400)
        
        # Call stored procedure
        cursor.execute(
            "EXEC SP_DatTruocSach @MaDocGia=?, @DanhSachJson=?, @SoNgayMuon=?",
            (ma_doc_gia, json_list, so_ngay_muon)
        )

        # Try to fetch the returned result row from stored procedure
        try:
            result = cursor.fetchone()
        except Exception as fe:
            print(f"[DEBUG] fetchone failed: {fe}")
            result = None

        # Ensure we commit the connection so stored-procedure side-effects are persisted
        try:
            conn.commit()
        except Exception as ce:
            print(f"[DEBUG] commit failed after SP_DatTruocSach: {ce}")

        print(f"[DEBUG] SP_DatTruocSach result: {result}")
        
        if result:
            return success(
                data={
                    "ma_phieu_muon": result[0],
                    "ma_doc_gia": result[1],
                    "ngay_tao_phieu": str(result[2]),
                    "ngay_het_han_giu_sach": str(result[3]),
                    "trang_thai": result[4],
                    "tong_so_cuon": result[5]
                },
                message="Đặt trước sách thành công. Vui lòng đến lấy sách trong 3 ngày."
            )
        else:
            return error("Không thể tạo phiếu mượn", 500)
            
    except Exception as e:
        error_msg = str(e)
        
        # Parse SQL error messages
        if "50001" in error_msg or "Danh sach dat truoc khong hop le" in error_msg:
            return error("Danh sách đặt trước không hợp lệ", 400)
        elif "50002" in error_msg or "Phieu muon phai co it nhat 1 dau sach" in error_msg:
            return error("Phiếu mượn phải có ít nhất 1 đầu sách", 400)
        elif "50003" in error_msg or "Moi dong sach phai co ISBN" in error_msg:
            return error("Mỗi dòng sách phải có ISBN và số lượng > 0", 400)
        elif "50004" in error_msg or "Moi phieu muon khong duoc qua 8 cuon" in error_msg:
            return error("Mỗi phiếu mượn không được quá 8 cuốn", 400)
        elif "50005" in error_msg or "Doc gia khong ton tai" in error_msg:
            return error("Độc giả không tồn tại hoặc không đủ điều kiện mượn", 400)
        elif "50006" in error_msg or "Doc gia vuot gioi han 40 cuon" in error_msg:
            return error("Độc giả vượt giới hạn 40 cuốn trong tháng", 400)
        elif "50007" in error_msg or "Co ISBN khong ton tai" in error_msg:
            return error("Có ISBN không tồn tại trong hệ thống", 400)
        elif "50008" in error_msg or "Khong du so luong sach" in error_msg:
            return error("Không đủ số lượng sách trong kho", 400)
        else:
            return error(f"Lỗi: {error_msg}", 500)
    
    finally:
        conn.close()


@borrowing_bp.route("/api/borrowing/history", methods=["GET"])
def get_all_borrowing_history():
    """
    Lấy lịch sử mượn trả của tất cả độc giả (phân trang)

    Query parameters:
    - page: số trang (mặc định 1)
    - per_page: số bản ghi mỗi trang (mặc định 20)
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Get total count
        cursor.execute("SELECT COUNT(DISTINCT MaPhieuMuon) AS TotalCount FROM V_LichSuMuonTra")
        count_row = cursor.fetchone()
        total = count_row[0] if count_row else 0

        # Calculate offset for pagination
        offset = (page - 1) * per_page

        # Query paginated results directly from the view (same columns as sp_GetBorrowingHistory)
        sql = (
            "SELECT MaPhieuMuon, MaDocGia, HoTen, Email, ISBN, TenSach, MaSach, NgayTaoPhieu, NgayMuon, "
            "HanTra, NgayTra, TinhTrangTra, TienPhat, TrangThai, "
            "CASE WHEN NgayTra IS NULL THEN N'Đang mượn' "
            "WHEN TinhTrangTra = N'BinhThuong' THEN N'Trả bình thường' "
            "WHEN TinhTrangTra = N'HongNhe' THEN N'Trả hư nhẹ' "
            "WHEN TinhTrangTra = N'HongNang' THEN N'Trả hư nặng' "
            "WHEN TinhTrangTra = N'Mat' THEN N'Mất sách' ELSE N'Chưa rõ' END AS TrangThaiTra "
            "FROM V_LichSuMuonTra "
            "ORDER BY NgayTaoPhieu DESC "
            f"OFFSET {offset} ROWS FETCH NEXT {per_page} ROWS ONLY"
        )

        cursor.execute(sql)
        rows = cursor.fetchall()

        history = []
        for row in rows:
            history.append({
                "ma_phieu_muon": row[0],
                "ma_doc_gia": row[1],
                "ten_doc_gia": row[2],
                "email": row[3],
                "isbn": row[4],
                "ten_sach": row[5],
                "ma_sach": row[6],
                "ngay_tao_phieu": str(row[7]),
                "ngay_muon": str(row[8]) if row[8] else None,
                "han_tra": str(row[9]) if row[9] else None,
                "ngay_tra": str(row[10]) if row[10] else None,
                "tinh_trang_tra": row[11],
                "tien_phat": float(row[12]) if row[12] else 0,
                "trang_thai": row[13],
                "trang_thai_tra": row[14]
            })

        return success(
            data={
                "history": history,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        )

    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)

    finally:
        conn.close()

# ==============================================================
# 0. AVAILABLE COPIES - Số lượng sách có thể mượn (tồn kho)
# ==============================================================

@borrowing_bp.route("/api/borrowing/available", methods=["GET"])
def get_available_copies():
    """
    Trả về số lượng cuốn vật lý sẵn có để mượn cho một ISBN (không tính cuốn đang mượn/mất/hỏng nặng)
    Query string: ?isbn=...
    """
    isbn = request.args.get("isbn", "").strip()
    if not isbn:
        return error("Vui lòng cung cấp ISBN", 400)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # fn_GetAvailableCopies trả về số cuốn có thể mượn (loại trừ DangMuon/Mat/HongNang)
        cursor.execute("SELECT dbo.fn_GetAvailableCopies(?) AS SoLuongFn", (isbn,))
        row_fn = cursor.fetchone()
        available_fn = int(row_fn[0]) if row_fn and row_fn[0] is not None else 0

        # Tính thêm số lượng 'Tot' chính xác như SP có thể đang dùng
        cursor.execute("SELECT COUNT(*) FROM CuonSach WHERE ISBN = ? AND TinhTrang = N'Tot'", (isbn,))
        row_tot = cursor.fetchone()
        available_tot = int(row_tot[0]) if row_tot and row_tot[0] is not None else 0

        return success(data={"isbn": isbn, "so_luong": available_fn, "so_luong_tot": available_tot})

    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)

    finally:
        conn.close()


# ==============================================================
# 2. XÁC NHẬN LẤY SÁCH - Confirm Borrowing
# ==============================================================

@borrowing_bp.route("/api/borrowing/<int:ma_phieu_muon>/confirm", methods=["PUT"])
def confirm_borrowing(ma_phieu_muon):
    """
    Xác nhận lấy sách - Confirm borrowing and set pickup date
    
    Request body:
    {
        "ma_nhan_vien": 1,
        "so_ngay_muon": 14
    }
    """
    data = request.get_json()
    
    if not data:
        return error("Dữ liệu gửi lên không hợp lệ", 400)
    
    ma_nhan_vien = data.get("ma_nhan_vien")
    so_ngay_muon = data.get("so_ngay_muon", 14)
    
    if not ma_nhan_vien:
        return error("Vui lòng cung cấp mã nhân viên", 400)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "EXEC SP_XacNhanLaySach @MaPhieuMuon=?, @MaNhanVien=?, @SoNgayMuon=?",
            (ma_phieu_muon, ma_nhan_vien, so_ngay_muon)
        )
        
        rows = cursor.fetchall()

        # commit to ensure stored-procedure updates persist
        try:
            conn.commit()
        except Exception as ce:
            print(f"[DEBUG] commit failed after SP_XacNhanLaySach: {ce}")
        
        if not rows:
            return error("Phiếu mượn không tồn tại hoặc không thể xác nhận", 400)
        
        # Format result - multiple rows for multiple books
        chi_tiet = []
        for row in rows:
            chi_tiet.append({
                "ma_sach": row[5],
                "isbn": row[6],
                "ten_sach": row[7],
                "han_tra": str(row[8]) if row[8] else None
            })
        
        return success(
            data={
                "ma_phieu_muon": rows[0][0],
                "ma_doc_gia": rows[0][1],
                "ma_nhan_vien": rows[0][2],
                "ngay_muon": str(rows[0][3]),
                "trang_thai": rows[0][4],
                "chi_tiet_sach": chi_tiet
            },
            message="Xác nhận lấy sách thành công"
        )
        
    except Exception as e:
        error_msg = str(e)
        
        if "50101" in error_msg or "Nhan vien xac nhan khong ton tai" in error_msg:
            return error("Nhân viên xác nhận không tồn tại", 400)
        elif "50102" in error_msg or "Phieu muon khong ton tai" in error_msg:
            return error("Phiếu mượn không tồn tại", 404)
        elif "50103" in error_msg or "Chi co phieu dang cho lay sach" in error_msg:
            return error("Chỉ có phiếu đang chờ lấy sách mới được xác nhận", 400)
        elif "50104" in error_msg or "Phieu muon da qua han giu sach" in error_msg:
            return error("Phiếu mượn đã quá hạn giữ sách và đã bị hủy", 400)
        else:
            return error(f"Lỗi: {error_msg}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 3. DANH SÁCH PHIẾU MƯỢN - List All Borrowing Records
# ==============================================================

@borrowing_bp.route("/api/borrowing", methods=["GET"])
def get_borrowing_list():
    """
    Lấy danh sách tất cả phiếu mượn
    
    Query parameters:
    - status: ChoLaySach, DangMuon, HoanThanh, DaHuy
    - member_id: lọc theo mã độc giả
    - page: số trang (mặc định 1)
    - per_page: số bản ghi mỗi trang (mặc định 20)
    """
    status = request.args.get("status", "").strip() or None
    member_id = request.args.get("member_id", "").strip()
    member_id = int(member_id) if member_id else None
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute(
            "EXEC sp_GetBorrowingList @Status=?, @MaDocGia=?, @Page=?, @PerPage=?",
            (status, member_id, page, per_page)
        )
        
        # Get total count from first result set
        count_row = cursor.fetchone()
        total = count_row[0] if count_row else 0
        
        # Get to next result set for paginated results
        cursor.nextset()
        rows = cursor.fetchall()
        
        borrowing_list = []
        for row in rows:
            borrowing_list.append({
                "ma_phieu_muon": row[0],
                "ma_doc_gia": row[1],
                "ten_doc_gia": row[2],
                "email": row[3],
                "so_dien_thoai": row[4],
                "tong_no": float(row[5]) if row[5] else 0,
                "trang_thai_the": row[6],
                "tong_so_cuon": row[7],
                "ngay_tao_phieu": str(row[8]),
                "ngay_muon": str(row[9]) if row[9] else None,
                "trang_thai": row[10],
                "ten_nhan_vien": row[11]
            })
        
        return success(
            data={
                "borrowing_records": borrowing_list,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        )
        
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 4. CHI TIẾT PHIẾU MƯỢN - Get Borrowing Detail
# ==============================================================

@borrowing_bp.route("/api/borrowing/<int:ma_phieu_muon>", methods=["GET"])
def get_borrowing_detail(ma_phieu_muon):
    """
    Lấy chi tiết một phiếu mượn
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute("EXEC sp_GetBorrowingDetail @MaPhieuMuon=?", (ma_phieu_muon,))
        
        # Get borrowing info from first result set
        row = cursor.fetchone()
        
        if not row:
            return error("Phiếu mượn không tồn tại", 404)
        
        borrowing_info = {
            "ma_phieu_muon": row[0],
            "ma_doc_gia": row[1],
            "ten_doc_gia": row[2],
            "email": row[3],
            "so_dien_thoai": row[4],
            "tong_no": float(row[5]) if row[5] else 0,
            "trang_thai_the": row[6],
            "ngay_tao_phieu": str(row[7]),
            "ngay_het_han_giu_sach": str(row[8]) if row[8] else None,
            "ngay_muon": str(row[9]) if row[9] else None,
            "trang_thai": row[10],
            "ten_nhan_vien": row[11]
        }
        
        # Get book details from second result set
        cursor.nextset()
        detail_rows = cursor.fetchall()
        
        chi_tiet_sach = []
        for detail_row in detail_rows:
            chi_tiet_sach.append({
                "ma_sach": detail_row[0],
                "isbn": detail_row[1],
                "ten_sach": detail_row[2],
                "nha_xuat_ban": detail_row[3],
                "nam_xuat_ban": detail_row[4],
                "han_tra": str(detail_row[5]) if detail_row[5] else None,
                "ngay_tra": str(detail_row[6]) if detail_row[6] else None,
                "tinh_trang_tra": detail_row[7],
                "tien_phat": float(detail_row[8]) if detail_row[8] else 0,
                "so_ngay_con_lai": detail_row[9],
                "so_ngay_qua_han": detail_row[10]
            })
        
        return success(
            data={
                "phieu_muon": borrowing_info,
                "chi_tiet_sach": chi_tiet_sach
            }
        )
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    finally:
        conn.close()





# ==============================================================
# 5. LỊCH SỬ MƯỢN TRẢ - Borrowing History
# ==============================================================

@borrowing_bp.route("/api/borrowing/member/<int:ma_doc_gia>/history", methods=["GET"])
def get_borrowing_history(ma_doc_gia):
    """
    Lấy lịch sử mượn trả của một độc giả
    
    Query parameters:
    - page: số trang (mặc định 1)
    - per_page: số bản ghi mỗi trang (mặc định 20)
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute(
            "EXEC sp_GetBorrowingHistory @MaDocGia=?, @Page=?, @PerPage=?",
            (ma_doc_gia, page, per_page)
        )
        
        # Get total count from first result set
        count_row = cursor.fetchone()
        total = count_row[0] if count_row else 0
        
        # Get paginated results from second result set
        cursor.nextset()
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            history.append({
                "ma_phieu_muon": row[0],
                "ma_doc_gia": row[1],
                "ten_doc_gia": row[2],
                "email": row[3],
                "isbn": row[4],
                "ten_sach": row[5],
                "ma_sach": row[6],
                "ngay_tao_phieu": str(row[7]),
                "ngay_muon": str(row[8]) if row[8] else None,
                "han_tra": str(row[9]) if row[9] else None,
                "ngay_tra": str(row[10]) if row[10] else None,
                "tinh_trang_tra": row[11],
                "tien_phat": float(row[12]) if row[12] else 0,
                "trang_thai": row[13],
                "trang_thai_tra": row[14]
            })
        
        return success(
            data={
                "history": history,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        )
        
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 6. PHIẾU SẮP HẾT HẠN - Expiring Soon
# ==============================================================

@borrowing_bp.route("/api/borrowing/expiring-soon", methods=["GET"])
def get_expiring_soon():
    """
    Lấy danh sách phiếu sắp hết hạn (< 2 ngày)
    
    Query parameters:
    - page: số trang (mặc định 1)
    - per_page: số bản ghi mỗi trang (mặc định 20)
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute(
            "EXEC sp_GetExpiringBorrowings @Page=?, @PerPage=?",
            (page, per_page)
        )
        
        # Get total count from first result set
        count_row = cursor.fetchone()
        total = count_row[0] if count_row else 0
        
        # Get paginated results from second result set
        cursor.nextset()
        rows = cursor.fetchall()
        
        expiring_list = []
        for row in rows:
            expiring_list.append({
                "ma_phieu_muon": row[0],
                "ma_doc_gia": row[1],
                "ten_doc_gia": row[2],
                "email": row[3],
                "so_dien_thoai": row[4],
                "isbn": row[5],
                "ten_sach": row[6],
                "ma_sach": row[7],
                "han_tra": str(row[8]) if row[8] else None,
                "so_ngay_con_lai": row[9]
            })
        
        return success(
            data={
                "expiring_records": expiring_list,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        )
        
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 7. PHIẾU QUÁHẠN - Overdue Borrowing
# ==============================================================

@borrowing_bp.route("/api/borrowing/overdue", methods=["GET"])
def get_overdue():
    """
    Lấy danh sách phiếu quá hạn
    
    Query parameters:
    - page: số trang (mặc định 1)
    - per_page: số bản ghi mỗi trang (mặc định 20)
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute(
            "EXEC sp_GetOverdueBorrowings @Page=?, @PerPage=?",
            (page, per_page)
        )
        
        # Get total count from first result set
        count_row = cursor.fetchone()
        total = count_row[0] if count_row else 0
        
        # Get paginated results from second result set
        cursor.nextset()
        rows = cursor.fetchall()
        
        overdue_list = []
        for row in rows:
            overdue_list.append({
                "ma_phieu_muon": row[0],
                "ma_doc_gia": row[1],
                "ten_doc_gia": row[2],
                "email": row[3],
                "so_dien_thoai": row[4],
                "tong_no": float(row[5]) if row[5] else 0,
                "ten_sach": row[6],
                "isbn": row[7],
                "ma_sach": row[8],
                "han_tra": str(row[9]) if row[9] else None,
                "so_ngay_qua_han": row[10],
                "ten_nhan_vien": row[11]
            })
        
        return success(
            data={
                "overdue_records": overdue_list,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        )
        
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 8. CANCEL BORROWING - Hủy phiếu mượn
# ==============================================================

@borrowing_bp.route("/api/borrowing/<int:ma_phieu_muon>/cancel", methods=["PUT"])
def cancel_borrowing(ma_phieu_muon):
    """
    Hủy phiếu mượn (chỉ hủy được phiếu chờ lấy sách)
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute("EXEC sp_CancelBorrowing @MaPhieuMuon=?", (ma_phieu_muon,))
        
        result = cursor.fetchone()
        
        if result:
            return success(
                data={"ma_phieu_muon": result[0]},
                message="Hủy phiếu mượn thành công"
            )
        else:
            return error("Không thể hủy phiếu mượn", 500)
            
    except Exception as e:
        error_msg = str(e)
        
        if "50201" in error_msg or "Phieu muon khong ton tai" in error_msg:
            return error("Phiếu mượn không tồn tại", 404)
        elif "50202" in error_msg or "Chi co the huy phieu dang cho lay sach" in error_msg:
            return error("Chỉ có thể hủy phiếu đang chờ lấy sách", 400)
        else:
            return error(f"Lỗi: {error_msg}", 500)
    
    finally:
        conn.close()


# --------------------------------------------------------------
# Debug: recent borrowings (safe, temporary)
# Returns latest PhieuMuon rows so we can confirm DB contents
# --------------------------------------------------------------
@borrowing_bp.route("/api/debug/borrowing/recent", methods=["GET"])
def debug_recent_borrowings():
    limit = request.args.get("limit", 50, type=int)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT TOP (?) MaPhieuMuon, MaDocGia, TrangThai, NgayTaoPhieu, NgayHetHanGiuSach FROM PhieuMuon ORDER BY NgayTaoPhieu DESC",
            (limit,)
        )

        rows = cursor.fetchall()

        result = []
        for r in rows:
            result.append({
                "ma_phieu_muon": r[0],
                "ma_doc_gia": r[1],
                "trang_thai": r[2],
                "ngay_tao_phieu": str(r[3]) if r[3] else None,
                "ngay_het_han_giu_sach": str(r[4]) if r[4] else None
            })

        return success(data={"recent": result, "count": len(result)})

    except Exception as e:
        return error(f"Lỗi debug: {str(e)}", 500)

    finally:
        conn.close()