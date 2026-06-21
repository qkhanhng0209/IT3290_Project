from flask import Blueprint, request, jsonify
import json
from app.database import get_connection
from app.response import success, error

returns_bp = Blueprint("returns", __name__)


# ==============================================================
# 1. PHIẾU MƯỢN CHỜ TRẢ - Get Books to Return
# ==============================================================

@returns_bp.route("/api/returns/borrowed", methods=["GET"])
def get_borrowed_books():
    """
    Lấy danh sách sách đang mượn của một phiếu để trả
    
    Query parameters:
    - ticket_id: mã phiếu mượn
    """
    ticket_id = request.args.get("ticket_id", "").strip()
    
    if not ticket_id:
        return error("Vui lòng cung cấp mã phiếu mượn", 400)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute("EXEC sp_GetBorrowedBooks @MaPhieuMuon=?", (int(ticket_id),))
        
        # Get ticket info from first result set
        ticket_row = cursor.fetchone()
        
        if not ticket_row:
            return error("Phiếu mượn không tồn tại", 404)
        
        if ticket_row[3] != "DangMuon":
            return error("Phiếu mượn không ở trạng thái 'Đang mượn'", 400)
        
        # Get books from second result set
        cursor.nextset()
        rows = cursor.fetchall()
        
        books = []
        for row in rows:
            books.append({
                "ma_sach": row[0],
                "isbn": row[1],
                "ten_sach": row[2],
                "nha_xuat_ban": row[3],
                "gia_bia": float(row[4]) if row[4] else 0,
                "he_so_den_bu": float(row[5]) if row[5] else 0,
                "han_tra": str(row[6]) if row[6] else None,
                "so_ngay_con_lai": row[7],
                "so_ngay_qua_han": row[8]
            })
        
        return success(
            data={
                "phieu_muon": {
                    "ma_phieu_muon": ticket_row[0],
                    "ma_doc_gia": ticket_row[1],
                    "ten_doc_gia": ticket_row[2]
                },
                "books": books
            }
        )
        
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 2. GHI NHẬN TRẢ SÁCH - Return Books
# ==============================================================

@returns_bp.route("/api/returns", methods=["POST"])
def return_books():
    """
    Ghi nhận trả sách - Record book return with condition and fees
    
    Request body:
    {
        "ma_phieu_muon": 1,
        "ma_nhan_vien": 1,
        "danh_sach_tra": [
            {
                "ma_sach": 1,
                "tinh_trang_tra": "BinhThuong",
                "phi_xu_ly": 0
            },
            {
                "ma_sach": 2,
                "tinh_trang_tra": "HongNang",
                "phi_xu_ly": 50000
            }
        ]
    }
    """
    data = request.get_json()
    
    if not data:
        return error("Dữ liệu gửi lên không hợp lệ", 400)
    
    ma_phieu_muon = data.get("ma_phieu_muon")
    ma_nhan_vien = data.get("ma_nhan_vien")
    danh_sach_tra = data.get("danh_sach_tra", [])
    
    if not ma_phieu_muon or not ma_nhan_vien:
        return error("Vui lòng cung cấp mã phiếu mượn và mã nhân viên", 400)
    
    if not danh_sach_tra or len(danh_sach_tra) == 0:
        return error("Danh sách trả không được trống", 400)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Convert danh_sach_tra to JSON format expected by SQL
        json_list = json.dumps(danh_sach_tra)
        
        # Call stored procedure
        cursor.execute(
            "EXEC SP_TraSach @MaPhieuMuon=?, @MaNhanVien=?, @DanhSachTraJson=?",
            (ma_phieu_muon, ma_nhan_vien, json_list)
        )
        
        # Get result summary
        result = cursor.fetchone()
        try:
            conn.commit()
        except Exception as ce:
            print(f"[DEBUG] commit failed in return_books: {ce}")
        
        if result:
            return success(
                data={
                    "ma_phieu_muon": result[0],
                    "ngay_tra": str(result[1]),
                    "tong_so_cuon_tra": result[2],
                    "tong_tien_phat": float(result[3]) if result[3] else 0,
                    "trang_thai": result[4]
                },
                message="Ghi nhận trả sách thành công"
            )
        else:
            return error("Không thể ghi nhận trả sách", 500)
            
    except Exception as e:
        error_msg = str(e)
        
        # Parse SQL error messages (50201-50209)
        if "50201" in error_msg or "Danh sach tra sach khong hop le" in error_msg:
            return error("Danh sách trả sách không hợp lệ", 400)
        elif "50202" in error_msg or "Nhan vien nhan tra khong ton tai" in error_msg:
            return error("Nhân viên nhận trả không tồn tại", 400)
        elif "50203" in error_msg or "Can chon it nhat 1 cuon sach de tra" in error_msg:
            return error("Cần chọn ít nhất 1 cuốn sách để trả", 400)
        elif "50204" in error_msg or "Ma sach, tinh trang tra hoac phi xu ly khong hop le" in error_msg:
            return error("Mã sách, tình trạng trả hoặc phí xử lý không hợp lệ", 400)
        elif "50205" in error_msg or "Danh sach tra bi trung ma sach" in error_msg:
            return error("Danh sách trả bị trùng mã sách", 400)
        elif "50206" in error_msg or "Phieu muon khong ton tai" in error_msg:
            return error("Phiếu mượn không tồn tại", 404)
        elif "50207" in error_msg or "Chi co phieu dang muon moi duoc ghi nhan tra sach" in error_msg:
            return error("Chỉ có phiếu đang mượn mới được ghi nhận trả sách", 400)
        elif "50208" in error_msg or "Co ma sach khong thuoc phieu muon nay" in error_msg:
            return error("Có mã sách không thuộc phiếu mượn này", 400)
        elif "50209" in error_msg or "Co sach da duoc tra truoc do" in error_msg:
            return error("Có sách đã được trả trước đó", 400)
        else:
            return error(f"Lỗi: {error_msg}", 500)
    
    finally:
        conn.close()


# ==============================================================
# 3. DANH SÁCH SÁCH ĐÃ TRẢ - List Returned Books
# ==============================================================

@returns_bp.route("/api/returns", methods=["GET"])
def get_return_list():
    """
    Lấy danh sách tất cả sách đã trả
    
    Query parameters:
    - condition: BinhThuong, HongNhe, HongNang, Mat
    - member_id: lọc theo mã độc giả
    - page: số trang (mặc định 1)
    - per_page: số bản ghi mỗi trang (mặc định 20)
    """
    condition = request.args.get("condition", "").strip() or None
    member_id = request.args.get("member_id", "").strip()
    member_id = int(member_id) if member_id else None
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute(
            "EXEC sp_GetReturnList @Condition=?, @MaDocGia=?, @Page=?, @PerPage=?",
            (condition, member_id, page, per_page)
        )
        
        # Get total count from first result set
        count_row = cursor.fetchone()
        total = count_row[0] if count_row else 0
        
        # Get paginated results from second result set
        cursor.nextset()
        rows = cursor.fetchall()
        # Collect current CuonSach.TinhTrang for the returned MaSach values
        ma_sach_ids = [r[5] for r in rows if r and r[5] is not None]
        current_status_map = {}
        if ma_sach_ids:
            # Build parameter placeholders safely
            placeholders = ','.join(['?'] * len(ma_sach_ids))
            try:
                cursor.execute(f"SELECT MaSach, TinhTrang FROM CuonSach WHERE MaSach IN ({placeholders})", tuple(ma_sach_ids))
                cs_rows = cursor.fetchall()
                for csr in cs_rows:
                    try:
                        current_status_map[int(csr[0])] = csr[1]
                    except Exception:
                        current_status_map[csr[0]] = csr[1]
            except Exception:
                # If this fails, leave the map empty and continue
                current_status_map = {}

        def _humanize_tinh_trang(code):
            if not code:
                return None
            # Normalize common codes to human-friendly Vietnamese text
            if code in ("Tot", "BinhThuong", "Bình thường", "Tot"):
                return "Bình thường"
            if code in ("HongNhe", "Hỏng nhẹ"):
                return "Hỏng nhẹ"
            if code in ("HongNang", "Hỏng nặng"):
                return "Hỏng nặng"
            if code in ("Mat", "Mất", "Mất sách"):
                return "Mất sách"
            if code in ("DangMuon", "Đang mượn"):
                return "Đang mượn"
            return str(code)

        return_list = []
        for row in rows:
            ma_sach_val = row[5]
            current_code = current_status_map.get(ma_sach_val) if ma_sach_val is not None else None
            return_list.append({
                "ma_phieu_muon": row[0],
                "ma_doc_gia": row[1],
                "ten_doc_gia": row[2],
                "email": row[3],
                "so_dien_thoai": row[4],
                "ma_sach": ma_sach_val,
                "isbn": row[6],
                "ten_sach": row[7],
                "gia_bia": float(row[8]) if row[8] else 0,
                "nha_xuat_ban": row[9],
                "ngay_muon": str(row[10]) if row[10] else None,
                "han_tra": str(row[11]) if row[11] else None,
                "ngay_tra": str(row[12]) if row[12] else None,
                "so_ngay_tre": row[13],
                "tinh_trang_tra": row[14],
                "ten_tinh_trang_tra": row[15],
                "tien_phat": float(row[16]) if row[16] else 0,
                "ten_nhan_vien_tra": row[17],
                "tinh_trang_hien_tai": _humanize_tinh_trang(current_code)
            })
        
        return success(
            data={
                "return_records": return_list,
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
# 5. THỐNG KÊ TRẢ SÁCH - Return Statistics
# ==============================================================

@returns_bp.route("/api/returns/stats", methods=["GET"])
def get_return_stats():
    """
    Lấy thống kê trả sách theo tình trạng
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Optional member_id query param: if present, compute stats only for that member
    member_id = request.args.get('member_id', '').strip()

    try:
        if member_id:
            # Compute stats for a single member
            cursor.execute(
                """
                SELECT
                    ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'BinhThuong' THEN 1 ELSE 0 END), 0) AS BinhThuong,
                    ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'HongNhe' THEN 1 ELSE 0 END), 0) AS HongNhe,
                    ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'HongNang' THEN 1 ELSE 0 END), 0) AS HongNang,
                    ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'Mat' THEN 1 ELSE 0 END), 0) AS MatSach,
                    ISNULL(SUM(ISNULL(ctp.TienPhat,0)), 0) AS TongTienPhat
                FROM ChiTietPhieuMuon ctp
                JOIN PhieuMuon pm ON pm.MaPhieuMuon = ctp.MaPhieuMuon
                WHERE pm.MaDocGia = ?
                """,
                (int(member_id),)
            )

            row = cursor.fetchone()
            stats = {
                'binh_thuong': int(row[0]) if row and row[0] is not None else 0,
                'hong_nhe': int(row[1]) if row and row[1] is not None else 0,
                'hong_nang': int(row[2]) if row and row[2] is not None else 0,
                'mat_sach': int(row[3]) if row and row[3] is not None else 0,
                'tong_tien_phat': float(row[4]) if row and row[4] is not None else 0.0
            }

            return success(data=stats)

        # No member_id: return global aggregate (preserve existing SP behavior)
        cursor.execute("EXEC sp_GetReturnStats")
        rows = cursor.fetchall()

        stats = {
            "binh_thuong": 0,
            "hong_nhe": 0,
            "hong_nang": 0,
            "mat_sach": 0,
            "tong_tien_phat": 0
        }

        for row in rows:
            tien_phat = float(row[2]) if row[2] else 0
            stats["tong_tien_phat"] += tien_phat

            if row[0] == "BinhThuong":
                stats["binh_thuong"] = row[1]
            elif row[0] == "HongNhe":
                stats["hong_nhe"] = row[1]
            elif row[0] == "HongNang":
                stats["hong_nang"] = row[1]
            elif row[0] == "Mat":
                stats["mat_sach"] = row[1]

        return success(data=stats)

    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)

    finally:
        conn.close()



@returns_bp.route('/api/returns/members', methods=['GET'])
def get_returns_members_stats():
    """
    Trả về thống kê trả sách theo từng độc giả (dành cho nhân viên):
    - MaDocGia, HoTen, số sách theo từng tình trạng, tổng tiền phạt
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT
                dg.MaDocGia AS MaDocGia,
                dg.HoTen AS HoTen,
                ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'BinhThuong' THEN 1 ELSE 0 END), 0) AS BinhThuong,
                ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'HongNhe' THEN 1 ELSE 0 END), 0) AS HongNhe,
                ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'HongNang' THEN 1 ELSE 0 END), 0) AS HongNang,
                ISNULL(SUM(CASE WHEN ctp.TinhTrangTra = N'Mat' THEN 1 ELSE 0 END), 0) AS MatSach,
                ISNULL(SUM(ISNULL(ctp.TienPhat,0)), 0) AS TongTienPhat
            FROM DocGia dg
            LEFT JOIN PhieuMuon pm ON pm.MaDocGia = dg.MaDocGia
            LEFT JOIN ChiTietPhieuMuon ctp ON ctp.MaPhieuMuon = pm.MaPhieuMuon
            GROUP BY dg.MaDocGia, dg.HoTen
            ORDER BY dg.MaDocGia
            """
        )

        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append({
                'MaDocGia': int(r[0]) if r[0] is not None else None,
                'HoTen': r[1],
                'binh_thuong': int(r[2]) if r[2] is not None else 0,
                'hong_nhe': int(r[3]) if r[3] is not None else 0,
                'hong_nang': int(r[4]) if r[4] is not None else 0,
                'mat_sach': int(r[5]) if r[5] is not None else 0,
                'tong_tien_phat': float(r[6]) if r[6] is not None else 0.0
            })

        return success(data={'members': result})

    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)

    finally:
        conn.close()



# ==============================================================
# 6. CHI TIẾT TRẢ SÁCH - Return Detail
# ==============================================================

@returns_bp.route("/api/returns/detail/<int:ma_phieu_muon>", methods=["GET"])
def get_return_detail(ma_phieu_muon):
    """
    Lấy chi tiết trả sách của một phiếu mượn
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Call stored procedure
        cursor.execute("EXEC sp_GetReturnDetail @MaPhieuMuon=?", (ma_phieu_muon,))
        
        # Get borrowing info from first result set
        row = cursor.fetchone()
        
        if not row:
            return error("Phiếu mượn không tồn tại", 404)
        
        phieu_info = {
            "ma_phieu_muon": row[0],
            "ma_doc_gia": row[1],
            "ten_doc_gia": row[2],
            "email": row[3],
            "so_dien_thoai": row[4],
            "tong_no": float(row[5]) if row[5] else 0,
            "ngay_muon": str(row[6]) if row[6] else None,
            "trang_thai": row[7],
            "ten_nhan_vien_tra": row[8]
        }
        
        # Get return details from second result set
        cursor.nextset()
        detail_rows = cursor.fetchall()
        
        chi_tiet_tra = []
        tong_tien_phat = 0
        for detail_row in detail_rows:
            tien_phat = float(detail_row[9]) if detail_row[9] else 0
            tong_tien_phat += tien_phat
            
            chi_tiet_tra.append({
                "ma_sach": detail_row[0],
                "isbn": detail_row[1],
                "ten_sach": detail_row[2],
                "nha_xuat_ban": detail_row[3],
                "han_tra": str(detail_row[4]) if detail_row[4] else None,
                "ngay_tra": str(detail_row[5]) if detail_row[5] else None,
                "so_ngay_tre": detail_row[6],
                "tinh_trang_tra": detail_row[7],
                "ten_tinh_trang_tra": detail_row[8],
                "tien_phat": tien_phat,
                "ly_do_tien_phat": detail_row[10]
            })
        
        return success(
            data={
                "phieu_tra": phieu_info,
                "chi_tiet_tra": chi_tiet_tra,
                "tong_tien_phat": tong_tien_phat
            }
        )
        
    except Exception as e:
        return error(f"Lỗi: {str(e)}", 500)
    
    finally:
        conn.close()
