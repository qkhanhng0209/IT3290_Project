// ============================================================
// DOM Elements
// ============================================================

// Tab elements
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Reserve tab
const reserveForm = document.querySelector("#reserveForm");
const readerId = document.querySelector("#readerId");
const borrowDays = document.querySelector("#borrowDays");
const isbn = document.querySelector("#isbn");
const quantity = document.querySelector("#quantity");
const addBookBtn = document.querySelector("#addBookBtn");
const borrowItems = document.querySelector("#borrowItems");
const borrowList = document.querySelector("#borrowList");
const reserveMessage = document.querySelector("#reserveMessage");

// Confirm tab
const confirmForm = document.querySelector("#confirmForm");
const borrowTicketId = document.querySelector("#borrowTicketId");
const staffId = document.querySelector("#staffId");
const confirmBorrowDays = document.querySelector("#confirmBorrowDays");
const confirmMessage = document.querySelector("#confirmMessage");
// Confirm tab - waiting tickets UI
const waitingTicketsSection = document.querySelector("#waitingTicketsSection");
const waitingTicketsTable = document.querySelector("#waitingTicketsTable");
const waitingTicketsMessage = document.querySelector("#waitingTicketsMessage");

// List tab
const statusFilter = document.querySelector("#statusFilter");
const memberIdFilter = document.querySelector("#memberIdFilter");
const filterBtn = document.querySelector("#filterBtn");
const resetBtn = document.querySelector("#resetBtn");
const borrowingListTable = document.querySelector("#borrowingListTable");
const listMessage = document.querySelector("#listMessage");
const loadMoreBtn = document.querySelector("#loadMoreBtn");

// Expiring tab
const expiringTable = document.querySelector("#expiringTable");
const expiringMessage = document.querySelector("#expiringMessage");

// Overdue tab
const overdueTable = document.querySelector("#overdueTable");
const overdueMessage = document.querySelector("#overdueMessage");

// History tab
const historyMemberId = document.querySelector("#historyMemberId");
const searchHistoryBtn = document.querySelector("#searchHistoryBtn");
const historyTable = document.querySelector("#historyTable");
const historyMessage = document.querySelector("#historyMessage");

// ============================================================
// State Management
// ============================================================

let reserveBooks = []; // Books to be reserved
let currentPage = 1;
let currentStatus = "";
let currentMemberId = "";

// ============================================================
// Utility Functions
// ============================================================

function showMessage(elementId, type, message) {
    const element = document.querySelector(elementId);
    if (!element) return;

    element.className = `message ${type}`;
    element.textContent = message;

    // Auto-hide after 5 seconds
    if (type === "success") {
        setTimeout(() => {
            element.textContent = "";
            element.className = "message";
        }, 5000);
    }
}

function hideMessage(elementId) {
    const element = document.querySelector(elementId);
    if (element) {
        element.className = "message";
        element.textContent = "";
    }
}

function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };
    return String(text || "").replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
}

function formatMoney(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString("vi-VN") + " đ";
}

function getStatusBadge(status) {
    const badges = {
        "ChoLaySach": '<span class="status-badge status-waiting">Chờ lấy</span>',
        "DangMuon": '<span class="status-badge status-borrowing">Đang mượn</span>',
        "HoanThanh": '<span class="status-badge status-completed">Hoàn thành</span>',
        "DaHuy": '<span class="status-badge status-cancelled">Đã hủy</span>'
    };
    return badges[status] || `<span>${escapeHtml(status)}</span>`;
}

function getConditionBadge(condition) {
    const badges = {
        "BinhThuong": "Bình thường",
        "HongNhe": "Hư nhẹ",
        "HongNang": "Hư nặng",
        "Mat": "Mất sách"
    };
    return badges[condition] || condition || "-";
}

// ============================================================
// Tab Switching
// ============================================================

tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;

        // Remove active class from all tabs
        tabBtns.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        // Add active class to clicked tab
        btn.classList.add("active");
        document.querySelector(`#${tabName}`).classList.add("active");

        // Load data when tab is activated
        if (tabName === "list" && borrowingListTable.innerHTML.includes("Đang tải")) {
            loadBorrowingList();
        } else if (tabName === "expiring" && expiringTable.innerHTML.includes("Đang tải")) {
            loadExpiringBorrowings();
        } else if (tabName === "overdue" && overdueTable.innerHTML.includes("Đang tải")) {
            loadOverdueBorrowings();
        } else if (tabName === "confirm") {
            // Ensure waiting pickup tickets are loaded when Confirm tab is shown
            try {
                if (typeof loadWaitingPickupTickets === 'function') loadWaitingPickupTickets();
            } catch (e) {
                console.warn('Error loading waiting tickets on tab switch:', e);
            }
        }
    });
});

// ============================================================
// 1. RESERVE BOOKS
// ============================================================

async function addBorrowBook() {
    const isbnValue = isbn.value.trim();
    let qtyValue = parseInt(quantity.value, 10) || 1;

    console.log("addBorrowBook called", { isbnValue, qtyValue });

    if (!isbnValue) {
        showMessage("#reserveMessage", "error", "Vui lòng nhập ISBN");
        return;
    }

    if (qtyValue < 1) {
        showMessage("#reserveMessage", "error", "Số lượng phải >= 1");
        return;
    }

    try {
        // Fetch book info and available copies. Note: vw_BookInfo.SoLuong is total copies,
        // so request actual available count from the borrowing API which uses fn_GetAvailableCopies.
        const bookInfo = await API.books.getBookByISBN(isbnValue);
        let availInfo = null;
        try {
            availInfo = await apiRequest(`/borrowing/available?isbn=${encodeURIComponent(isbnValue)}`);
        } catch (err) {
            // If available endpoint fails, fallback to total copies reported by bookInfo
            availInfo = null;
        }

        // Prefer the SP-compatible 'so_luong_tot' if available (DB may still use TinhTrang='Tot')
        let maxQty = 0;
        if (availInfo) {
            if (typeof availInfo.so_luong_tot !== 'undefined' && availInfo.so_luong_tot !== null) {
                maxQty = Number(availInfo.so_luong_tot);
            } else if (typeof availInfo.so_luong !== 'undefined' && availInfo.so_luong !== null) {
                maxQty = Number(availInfo.so_luong);
            }
        }
        if (!maxQty) maxQty = Number(bookInfo.so_luong) || 0;

        if (maxQty <= 0) {
            showMessage("#reserveMessage", "error", "Không còn cuốn nào có thể mượn trong kho");
            return;
        }

        if (qtyValue > maxQty) {
            showMessage("#reserveMessage", "info", `Chỉ còn ${maxQty} cuốn. Đã điều chỉnh số lượng.`);
            qtyValue = maxQty;
        }

        // Check if already added
        const existing = reserveBooks.find(b => b.isbn === isbnValue);
        if (existing) {
            existing.so_luong = Math.min(existing.so_luong + qtyValue, maxQty);
            existing.max_so_luong = maxQty;
            existing.ten_sach = bookInfo.ten_sach || existing.ten_sach || "";
        } else {
            reserveBooks.push({
                isbn: isbnValue,
                so_luong: qtyValue,
                max_so_luong: maxQty,
                ten_sach: bookInfo.ten_sach || ""
            });
        }

        renderBorrowList();
        isbn.value = "";
        quantity.value = "1";
        isbn.focus();

        hideMessage("#reserveMessage");
    } catch (err) {
        showMessage("#reserveMessage", "error", err.message || "Không tìm thấy sách");
    }
}

function removeBorrowBook(index) {
    reserveBooks.splice(index, 1);
    renderBorrowList();
}

function renderBorrowList() {
    borrowList.innerHTML = "";

    console.log("renderBorrowList", reserveBooks.length, reserveBooks);

    reserveBooks.forEach((book, index) => {
        const item = document.createElement("div");
        item.className = "borrow-item";
        const maxInfo = book.max_so_luong ? ` / ${book.max_so_luong}` : "";
        item.innerHTML = `
            <div class="borrow-item-info">
                <div class="borrow-item-isbn">${escapeHtml(book.isbn)}</div>
                <div class="borrow-item-title">${escapeHtml(book.ten_sach || "-")}</div>
                <div class="borrow-item-qty">
                    Số lượng:
                    <input type="number" class="borrow-item-qty-input" data-index="${index}" min="1" max="${book.max_so_luong || 999}" value="${book.so_luong}" style="width:80px; margin-left:8px;">
                    <span class="muted">${maxInfo}</span>
                </div>
            </div>
            <button type="button" class="borrow-item-remove" data-index="${index}">
                ✕ Xóa
            </button>
        `;
        borrowList.appendChild(item);
    });

    // Toggle visibility
    borrowItems.style.display = reserveBooks.length > 0 ? "block" : "none";

    // Add event listeners
    borrowList.querySelectorAll(".borrow-item-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            removeBorrowBook(parseInt(btn.dataset.index));
        });
    });
    // Quantity change handlers
    borrowList.querySelectorAll(".borrow-item-qty-input").forEach(input => {
        input.addEventListener("change", (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            let val = parseInt(e.target.value, 10) || 1;
            const max = reserveBooks[idx] && reserveBooks[idx].max_so_luong ? reserveBooks[idx].max_so_luong : 999;
            if (val < 1) val = 1;
            if (val > max) {
                showMessage("#reserveMessage", "error", `Số lượng tối đa là ${max}`);
                val = max;
            }
            if (reserveBooks[idx]) {
                reserveBooks[idx].so_luong = val;
            }
            renderBorrowList();
        });
    });
}

if (addBookBtn) {
    addBookBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await addBorrowBook();
    });
}

if (reserveForm) {
    reserveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage("#reserveMessage");

    const memberIdValue = parseInt(readerId.value);
    const borrowDaysValue = parseInt(borrowDays.value) || 14;

    if (!memberIdValue) {
        showMessage("#reserveMessage", "error", "Vui lòng nhập mã độc giả");
        return;
    }

    if (reserveBooks.length === 0) {
        showMessage("#reserveMessage", "error", "Vui lòng thêm ít nhất 1 sách");
        return;
    }

    try {
        const payload = {
            ma_doc_gia: memberIdValue,
            danh_sach_sach: reserveBooks.map(b => ({ isbn: b.isbn, so_luong: b.so_luong })),
            so_ngay_muon: borrowDaysValue
        };
        console.log("Reserve payload:", payload);

        const result = await apiRequest("/borrowing/reserve", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        showMessage("#reserveMessage", "success", result.message || "Đặt trước sách thành công!");

        // Update info display
        document.querySelector("#lastTicketId").textContent = result.ma_phieu_muon;
        document.querySelector("#lastStatus").textContent = "Chờ lấy";
        document.querySelector("#lastBookCount").textContent = result.tong_so_cuon;
        document.querySelector("#lastHoldDate").textContent = formatDate(result.ngay_het_han_giu_sach);

        // Render result table
        const tbody = document.querySelector("#reserveResultTable");
        tbody.innerHTML = reserveBooks.map((book, idx) => `
            <tr>
                <td>${escapeHtml(book.isbn)}</td>
                <td>${escapeHtml(book.ten_sach || "-")}</td>
                <td>${book.so_luong}</td>
            </tr>
        `).join("");

        // Reset form
        reserveBooks = [];
        renderBorrowList();
        readerId.value = "";
        borrowDays.value = "14";
        isbn.value = "";
        quantity.value = "1";

    } catch (error) {
        showMessage("#reserveMessage", "error", error.message);
    }
    });
}

// ============================================================
// 2. CONFIRM PICKUP
// ============================================================

async function loadWaitingPickupTickets(memberId = '') {
    if (!waitingTicketsTable) return;

    waitingTicketsTable.innerHTML = '<tr><td colspan="5" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const params = new URLSearchParams({ page: 1, per_page: 100 });
        params.append('status', 'ChoLaySach');
        if (memberId) params.append('member_id', memberId);

        const url = `/borrowing?${params.toString()}`;
        console.log('loadWaitingPickupTickets: fetching', url);
        const result = await apiRequest(url);
        console.log('loadWaitingPickupTickets: result', result);

        const records = result && Array.isArray(result.borrowing_records) ? result.borrowing_records : [];

        if (records.length === 0) {
            waitingTicketsTable.innerHTML = '<tr><td colspan="5" class="empty-state">Không có phiếu chờ lấy</td></tr>';
            return;
        }

        waitingTicketsTable.innerHTML = records.map(r => `
            <tr>
                <td>${r.ma_phieu_muon}</td>
                <td>${escapeHtml(r.ten_doc_gia)}</td>
                <td>${r.tong_so_cuon}</td>
                <td>${formatDate(r.ngay_tao_phieu)}</td>
                <td><button class="btn btn-primary btn-sm" data-id="${r.ma_phieu_muon}">Chọn</button></td>
            </tr>
        `).join('');

        // Attach click handlers to select a ticket
        waitingTicketsTable.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                if (borrowTicketId) borrowTicketId.value = id;
                // smooth focus to ticket id field
                if (borrowTicketId) borrowTicketId.focus();
            });
        });

    } catch (err) {
        console.error('loadWaitingPickupTickets error', err);
        waitingTicketsTable.innerHTML = `<tr><td colspan="5" class="error">Lỗi tải: ${escapeHtml(err.message || String(err))}</td></tr>`;
        showMessage('#waitingTicketsMessage', 'error', err.message || 'Lỗi tải danh sách chờ lấy');
    }
}

if (confirmForm) {
    confirmForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage("#confirmMessage");

    const ticketIdValue = parseInt(borrowTicketId.value);
    const staffIdValue = parseInt(staffId.value);
    const borrowDaysValue = confirmBorrowDays.value ? parseInt(confirmBorrowDays.value) : 14;

    if (!ticketIdValue || !staffIdValue) {
        showMessage("#confirmMessage", "error", "Vui lòng điền đầy đủ thông tin");
        return;
    }

    try {
        const result = await apiRequest(`/borrowing/${ticketIdValue}/confirm`, {
            method: "PUT",
            body: JSON.stringify({
                ma_nhan_vien: staffIdValue,
                so_ngay_muon: borrowDaysValue
            })
        });

        showMessage("#confirmMessage", "success", result.message || "Xác nhận lấy sách thành công!");

        // Render result table
        const tbody = document.querySelector("#confirmResultTable");
        tbody.innerHTML = result.chi_tiet_sach.map(book => `
            <tr>
                <td>${book.ma_sach}</td>
                <td>${escapeHtml(book.isbn)}</td>
                <td>${escapeHtml(book.ten_sach)}</td>
                <td>${formatDate(book.han_tra)}</td>
            </tr>
        `).join("");

        // Reset form
        borrowTicketId.value = "";
        staffId.value = "";
        confirmBorrowDays.value = "";

        // Refresh waiting list and main lists so UI stays in sync
        try {
            if (typeof loadWaitingPickupTickets === 'function') loadWaitingPickupTickets();
            if (typeof loadBorrowingList === 'function') loadBorrowingList(currentStatus, currentMemberId);
            if (typeof loadExpiringBorrowings === 'function') loadExpiringBorrowings(currentMemberId);
            if (typeof loadOverdueBorrowings === 'function') loadOverdueBorrowings(currentMemberId);
        } catch (e) {
            console.warn('Error refreshing lists after confirm:', e);
        }

    } catch (error) {
        showMessage("#confirmMessage", "error", error.message);
    }
    });
}

// ============================================================
// 3. BORROWING LIST
// ============================================================

async function loadBorrowingList(status = "", memberId = "") {
    currentStatus = status;
    currentMemberId = memberId;
    currentPage = 1;

    hideMessage("#listMessage");
    borrowingListTable.innerHTML = '<tr><td colspan="8" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            per_page: 20
        });

        if (status) params.append("status", status);
        if (memberId) params.append("member_id", memberId);

        const result = await apiRequest(`/borrowing?${params.toString()}`);

        borrowingListTable.innerHTML = "";

        if (!result.borrowing_records || result.borrowing_records.length === 0) {
            borrowingListTable.innerHTML = '<tr><td colspan="8" class="empty-state">Không có phiếu mượn</td></tr>';
            loadMoreBtn.style.display = "none";
            return;
        }

        result.borrowing_records.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.ma_phieu_muon}</td>
                <td>${escapeHtml(record.ten_doc_gia)}</td>
                <td>${escapeHtml(record.email || "-")}</td>
                <td>${record.tong_so_cuon}</td>
                <td>${formatDate(record.ngay_tao_phieu)}</td>
                <td>${getStatusBadge(record.trang_thai)}</td>
                <td>${escapeHtml(record.ten_nhan_vien)}</td>
                <td>
                    <button class="btn btn-primary" onclick="viewBorrowingDetail(${record.ma_phieu_muon})" style="padding: 6px 10px; font-size: 12px;">
                        Chi tiết
                    </button>
                </td>
            `;
            borrowingListTable.appendChild(row);
        });

        // Show/hide load more button
        loadMoreBtn.style.display = result.page < result.total_pages ? "block" : "none";

    } catch (error) {
        borrowingListTable.innerHTML = '<tr><td colspan="8" class="error">Lỗi tải dữ liệu</td></tr>';
        showMessage("#listMessage", "error", error.message);
    }
}

if (filterBtn) {
    filterBtn.addEventListener("click", () => {
    const status = statusFilter.value;
    const memberId = memberIdFilter.value;
    loadBorrowingList(status, memberId);
});
}

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        statusFilter.value = "";
        try {
            const role = localStorage.getItem('authRole');
            const authUserRaw = localStorage.getItem('authUser');
            const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
            if (role === 'employee') {
                memberIdFilter.value = '';
                loadBorrowingList();
            } else if (authUser && authUser.MaDocGia) {
                memberIdFilter.value = authUser.MaDocGia;
                loadBorrowingList('', authUser.MaDocGia);
            } else {
                memberIdFilter.value = '';
                loadBorrowingList();
            }
        } catch (e) {
            memberIdFilter.value = '';
            loadBorrowingList();
        }
    });
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", async () => {
    currentPage++;
    hideMessage("#listMessage");

    try {
        const params = new URLSearchParams({
            page: currentPage,
            per_page: 20
        });

        if (currentStatus) params.append("status", currentStatus);
        if (currentMemberId) params.append("member_id", currentMemberId);

        const result = await apiRequest(`/borrowing?${params.toString()}`);

        if (result.borrowing_records && result.borrowing_records.length > 0) {
            result.borrowing_records.forEach(record => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${record.ma_phieu_muon}</td>
                    <td>${escapeHtml(record.ten_doc_gia)}</td>
                    <td>${escapeHtml(record.email || "-")}</td>
                    <td>${record.tong_so_cuon}</td>
                    <td>${formatDate(record.ngay_tao_phieu)}</td>
                    <td>${getStatusBadge(record.trang_thai)}</td>
                    <td>${escapeHtml(record.ten_nhan_vien)}</td>
                    <td>
                        <button class="btn btn-primary" onclick="viewBorrowingDetail(${record.ma_phieu_muon})" style="padding: 6px 10px; font-size: 12px;">
                            Chi tiết
                        </button>
                    </td>
                `;
                borrowingListTable.appendChild(row);
            });
        }

        // Update load more button
        loadMoreBtn.style.display = currentPage < result.total_pages ? "block" : "none";

    } catch (error) {
        showMessage("#listMessage", "error", error.message);
    }
    });
}

// ============================================================
// 4. BORROWING DETAIL (Modal or new view)
// ============================================================

async function viewBorrowingDetail(maPhieuMuon) {
    try {
        const result = await apiRequest(`/borrowing/${maPhieuMuon}`);

        const borrowing = result.phieu_muon;
        const details = result.chi_tiet_sach;

        // Role-based guard: readers can only view their own borrowing details
        try {
            const role = localStorage.getItem('authRole');
            if (role !== 'employee') {
                const authUserRaw = localStorage.getItem('authUser');
                const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
                if (authUser && authUser.MaDocGia && Number(borrowing.ma_doc_gia) !== Number(authUser.MaDocGia)) {
                    alert('Bạn không có quyền xem phiếu mượn này.');
                    return;
                }
            }
        } catch (ignore) {
            // ignore parsing errors
        }

        // Create a simple alert with info (in real app, use modal)
        let info = `
PHIẾU MƯỢN #${borrowing.ma_phieu_muon}
Độc giả: ${borrowing.ten_doc_gia} (${borrowing.ma_doc_gia})
Email: ${borrowing.email}
Điện thoại: ${borrowing.so_dien_thoai}
Tổng nợ: ${borrowing.tong_no}đ
Trạng thái: ${borrowing.trang_thai}

DANH SÁCH SÁCH:
${details.map((d, i) => `
${i + 1}. ${d.ten_sach} (${d.isbn})
   Hạn trả: ${d.han_tra || "-"}
   Ngày trả: ${d.ngay_tra || "-"}
   Tình trạng: ${getConditionBadge(d.tinh_trang_tra)}
   Tiền phạt: ${d.tien_phat}đ
`).join("")}
        `;

        alert(info);
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
}

// Make it global
window.viewBorrowingDetail = viewBorrowingDetail;

// ============================================================
// 5. EXPIRING BORROWINGS
// ============================================================

async function loadExpiringBorrowings(memberId = '') {
    hideMessage("#expiringMessage");
    expiringTable.innerHTML = '<tr><td colspan="7" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const result = await apiRequest("/borrowing/expiring-soon?page=1&per_page=50");

        expiringTable.innerHTML = "";

        let records = result.expiring_records || [];
        if (memberId) {
            records = records.filter(r => String(r.ma_doc_gia) === String(memberId));
        }

        if (!records || records.length === 0) {
            expiringTable.innerHTML = '<tr><td colspan="7" class="empty-state">Không có phiếu sắp hết hạn</td></tr>';
            return;
        }

        records.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.ma_phieu_muon}</td>
                <td>${escapeHtml(record.ten_doc_gia)}</td>
                <td>${escapeHtml(record.email || "-")}</td>
                <td>${escapeHtml(record.so_dien_thoai || "-")}</td>
                <td>${escapeHtml(record.ten_sach)}</td>
                <td>${formatDate(record.han_tra)}</td>
                <td>
                    <span class="soon-badge">${record.so_ngay_con_lai} ngày</span>
                </td>
            `;
            expiringTable.appendChild(row);
        });

    } catch (error) {
        expiringTable.innerHTML = '<tr><td colspan="7" class="error">Lỗi tải dữ liệu</td></tr>';
        showMessage("#expiringMessage", "error", error.message);
    }
}

// ============================================================
// 6. OVERDUE BORROWINGS
// ============================================================

async function loadOverdueBorrowings(memberId = '') {
    hideMessage("#overdueMessage");
    overdueTable.innerHTML = '<tr><td colspan="7" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const result = await apiRequest("/borrowing/overdue?page=1&per_page=50");

        overdueTable.innerHTML = "";

        let records = result.overdue_records || [];
        if (memberId) {
            records = records.filter(r => String(r.ma_doc_gia) === String(memberId));
        }

        if (!records || records.length === 0) {
            overdueTable.innerHTML = '<tr><td colspan="7" class="empty-state">Không có phiếu quá hạn</td></tr>';
            return;
        }

        records.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.ma_phieu_muon}</td>
                <td>${escapeHtml(record.ten_doc_gia)}</td>
                <td>${escapeHtml(record.email || "-")}</td>
                <td>${escapeHtml(record.ten_sach)}</td>
                <td>${formatDate(record.han_tra)}</td>
                <td>
                    <span class="overdue-badge">${record.so_ngay_qua_han} ngày</span>
                </td>
                <td>${escapeHtml(record.ten_nhan_vien || "-")}</td>
            `;
            overdueTable.appendChild(row);
        });

    } catch (error) {
        overdueTable.innerHTML = '<tr><td colspan="7" class="error">Lỗi tải dữ liệu</td></tr>';
        showMessage("#overdueMessage", "error", error.message);
    }
}

// ============================================================
// 7. BORROWING HISTORY
// ============================================================

if (searchHistoryBtn) {
    searchHistoryBtn.addEventListener("click", async () => {
    // When Search clicked: if member id provided -> load member history, otherwise load all history
    const memberId = historyMemberId.value.trim();
    await loadBorrowingHistory(memberId || '');
    });
}

// Allow Enter key in history search
if (historyMemberId) {
    historyMemberId.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            if (searchHistoryBtn) searchHistoryBtn.click();
        }
    });
}


// Load borrowing history; if memberId is empty, load all history
async function loadBorrowingHistory(memberId = '', page = 1, perPage = 50) {
    hideMessage("#historyMessage");
    historyTable.innerHTML = '<tr><td colspan="8" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        let result;
        if (memberId) {
            result = await apiRequest(`/borrowing/member/${memberId}/history?page=${page}&per_page=${perPage}`);
        } else {
            result = await apiRequest(`/borrowing/history?page=${page}&per_page=${perPage}`);
        }

        historyTable.innerHTML = "";

        if (!result.history || result.history.length === 0) {
            historyTable.innerHTML = '<tr><td colspan="8" class="empty-state">Không có lịch sử mượn trả</td></tr>';
            return;
        }

        result.history.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.ma_phieu_muon}</td>
                <td>${escapeHtml(record.ten_sach)}</td>
                <td>${escapeHtml(record.isbn)}</td>
                <td>${formatDate(record.ngay_muon)}</td>
                <td>${formatDate(record.han_tra)}</td>
                <td>${formatDate(record.ngay_tra)}</td>
                <td>${escapeHtml(record.trang_thai_tra)}</td>
                <td>${formatMoney(record.tien_phat)}</td>
            `;
            historyTable.appendChild(row);
        });

    } catch (error) {
        historyTable.innerHTML = '<tr><td colspan="8" class="error">Lỗi tải dữ liệu</td></tr>';
        showMessage("#historyMessage", "error", error.message);
    }
}

// ============================================================
// Initialize
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("Borrowing page initialized");
});

// Auto-load lists so the page shows data immediately when opened
document.addEventListener("DOMContentLoaded", () => {
    try {
        const role = localStorage.getItem('authRole');
        const authUserRaw = localStorage.getItem('authUser');
        const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
        const memberIdDefault = (role !== 'employee' && authUser && authUser.MaDocGia) ? String(authUser.MaDocGia) : '';

        // Load borrowing list (main table) with member filter for readers
        loadBorrowingList('', memberIdDefault);

        // Load expiring and overdue summaries in background (filtered for readers)
        loadExpiringBorrowings(memberIdDefault);
        loadOverdueBorrowings(memberIdDefault);
        // Load borrowing history: for readers show their history, for employees show all
        try {
            if (typeof loadBorrowingHistory === 'function') loadBorrowingHistory(memberIdDefault);
        } catch (e) {
            console.warn('Error loading borrowing history on init:', e);
        }
        // If current user is employee, also load waiting pickup tickets
        if (role === 'employee') {
            try {
                if (typeof loadWaitingPickupTickets === 'function') loadWaitingPickupTickets();
            } catch (e) {
                console.warn('Error initial loading waiting tickets:', e);
            }
        }
    } catch (err) {
        console.error("Error initializing borrowing page:", err);
    }
});

// ============================================================
// Role-based UI gate (Confirm pickup only for employees)
// ============================================================
function applyRoleGate() {
    try {
        const role = localStorage.getItem('authRole');
        const authUserRaw = localStorage.getItem('authUser');
        const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

        const confirmTabBtn = document.querySelector('.tab-btn[data-tab="confirm"]');
        const confirmTabContent = document.getElementById('confirm');

        if (role === 'employee') {
            if (confirmTabBtn) confirmTabBtn.style.display = '';
            if (confirmTabContent) confirmTabContent.style.display = '';

            // Prefill staffId from logged-in employee and lock the field
            if (authUser && authUser.MaNhanVien) {
                const staffInput = document.querySelector('#staffId');
                if (staffInput) {
                    staffInput.value = authUser.MaNhanVien;
                    staffInput.readOnly = true;
                }
            }
            // Load waiting tickets for employees so they can pick one to confirm
            try {
                if (typeof loadWaitingPickupTickets === 'function') loadWaitingPickupTickets();
            } catch (e) {
                console.warn('Could not load waiting tickets:', e);
            }
            // Auto-switch to Confirm tab for employees
            try {
                if (confirmTabBtn) confirmTabBtn.click();
            } catch (e) {
                console.warn('Auto-activate confirm tab failed:', e);
            }
        } else {
            if (confirmTabBtn) confirmTabBtn.style.display = 'none';
            if (confirmTabContent) confirmTabContent.style.display = 'none';

            // If confirm tab is active, switch to reserve
            const activeBtn = document.querySelector('.tab-btn.active');
            if (activeBtn && activeBtn.dataset.tab === 'confirm') {
                const reserveBtn = document.querySelector('.tab-btn[data-tab="reserve"]');
                if (reserveBtn) reserveBtn.click();
            }
        }
    } catch (e) {
        console.error('applyRoleGate error:', e);
    }
}

// Apply immediately on load so UI reflects current login
document.addEventListener('DOMContentLoaded', applyRoleGate);

// Apply additional UI rules: hide reserve tab for employees and filter lists
function applyUIByRole() {
    try {
        const role = localStorage.getItem('authRole');
        const authUserRaw = localStorage.getItem('authUser');
        const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;

        // Hide reserve tab for employees
        const reserveTabBtn = document.querySelector('.tab-btn[data-tab="reserve"]');
        const reserveTabContent = document.getElementById('reserve');
        if (role === 'employee') {
            if (reserveTabBtn) reserveTabBtn.style.display = 'none';
            if (reserveTabContent) reserveTabContent.style.display = 'none';
        } else {
            if (reserveTabBtn) reserveTabBtn.style.display = '';
            if (reserveTabContent) reserveTabContent.style.display = '';
        }

        // If reader, prefill readerId with logged-in MaDocGia and lock it
        const readerInput = document.querySelector('#readerId');
        if (role !== 'employee' && authUser && authUser.MaDocGia) {
            if (readerInput) {
                readerInput.value = authUser.MaDocGia;
                readerInput.readOnly = true;
            }
        } else {
            if (readerInput) {
                readerInput.value = '';
                readerInput.readOnly = false;
            }
        }

        // If employee, clear member filter so they see all records; otherwise set filter to their MaDocGia
        const memberFilter = document.querySelector('#memberIdFilter');
        if (memberFilter) {
            if (role === 'employee') {
                memberFilter.value = '';
                memberFilter.readOnly = false;
            } else if (authUser && authUser.MaDocGia) {
                memberFilter.value = authUser.MaDocGia;
                memberFilter.readOnly = true;
            }
        }

        // Prefill or hide history search for readers
        const historyInput = document.querySelector('#historyMemberId');
        const historyBtn = document.querySelector('#searchHistoryBtn');
        if (historyInput) {
            if (role !== 'employee' && authUser && authUser.MaDocGia) {
                // Hide input and search button for readers; they automatically see their own history
                historyInput.style.display = 'none';
                if (historyBtn) historyBtn.style.display = 'none';
            } else {
                historyInput.style.display = '';
                if (historyBtn) historyBtn.style.display = '';
                historyInput.value = '';
                historyInput.readOnly = false;
            }
        }
    } catch (e) {
        console.error('applyUIByRole error', e);
    }
}

document.addEventListener('DOMContentLoaded', applyUIByRole);