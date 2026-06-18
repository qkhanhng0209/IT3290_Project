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
        }
    });
});

// ============================================================
// 1. RESERVE BOOKS
// ============================================================

function addBorrowBook() {
    const isbnValue = isbn.value.trim();
    const qtyValue = parseInt(quantity.value) || 1;

    if (!isbnValue) {
        showMessage("#reserveMessage", "error", "Vui lòng nhập ISBN");
        return;
    }

    if (qtyValue < 1) {
        showMessage("#reserveMessage", "error", "Số lượng phải >= 1");
        return;
    }

    // Check if already added
    const existing = reserveBooks.find(b => b.isbn === isbnValue);
    if (existing) {
        existing.so_luong += qtyValue;
    } else {
        reserveBooks.push({
            isbn: isbnValue,
            so_luong: qtyValue
        });
    }

    renderBorrowList();
    isbn.value = "";
    quantity.value = "1";
    isbn.focus();

    hideMessage("#reserveMessage");
}

function removeBorrowBook(index) {
    reserveBooks.splice(index, 1);
    renderBorrowList();
}

function renderBorrowList() {
    borrowList.innerHTML = "";

    reserveBooks.forEach((book, index) => {
        const item = document.createElement("div");
        item.className = "borrow-item";
        item.innerHTML = `
            <div class="borrow-item-info">
                <div class="borrow-item-isbn">${escapeHtml(book.isbn)}</div>
                <div class="borrow-item-qty">Số lượng: ${book.so_luong}</div>
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
}

addBookBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addBorrowBook();
});

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
        const result = await apiRequest("/borrowing/reserve", {
            method: "POST",
            body: JSON.stringify({
                ma_doc_gia: memberIdValue,
                danh_sach_sach: reserveBooks,
                so_ngay_muon: borrowDaysValue
            })
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

// ============================================================
// 2. CONFIRM PICKUP
// ============================================================

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

    } catch (error) {
        showMessage("#confirmMessage", "error", error.message);
    }
});

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

filterBtn.addEventListener("click", () => {
    const status = statusFilter.value;
    const memberId = memberIdFilter.value;
    loadBorrowingList(status, memberId);
});

resetBtn.addEventListener("click", () => {
    statusFilter.value = "";
    memberIdFilter.value = "";
    loadBorrowingList();
});

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

// ============================================================
// 4. BORROWING DETAIL (Modal or new view)
// ============================================================

async function viewBorrowingDetail(maPhieuMuon) {
    try {
        const result = await apiRequest(`/borrowing/${maPhieuMuon}`);

        const borrowing = result.phieu_muon;
        const details = result.chi_tiet_sach;

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

async function loadExpiringBorrowings() {
    hideMessage("#expiringMessage");
    expiringTable.innerHTML = '<tr><td colspan="7" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const result = await apiRequest("/borrowing/expiring-soon?page=1&per_page=50");

        expiringTable.innerHTML = "";

        if (!result.expiring_records || result.expiring_records.length === 0) {
            expiringTable.innerHTML = '<tr><td colspan="7" class="empty-state">Không có phiếu sắp hết hạn</td></tr>';
            return;
        }

        result.expiring_records.forEach(record => {
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

async function loadOverdueBorrowings() {
    hideMessage("#overdueMessage");
    overdueTable.innerHTML = '<tr><td colspan="7" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const result = await apiRequest("/borrowing/overdue?page=1&per_page=50");

        overdueTable.innerHTML = "";

        if (!result.overdue_records || result.overdue_records.length === 0) {
            overdueTable.innerHTML = '<tr><td colspan="7" class="empty-state">Không có phiếu quá hạn</td></tr>';
            return;
        }

        result.overdue_records.forEach(record => {
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

searchHistoryBtn.addEventListener("click", async () => {
    const memberId = historyMemberId.value.trim();

    if (!memberId) {
        showMessage("#historyMessage", "error", "Vui lòng nhập mã độc giả");
        return;
    }

    hideMessage("#historyMessage");
    historyTable.innerHTML = '<tr><td colspan="8" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
        const result = await apiRequest(`/borrowing/member/${memberId}/history?page=1&per_page=50`);

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
});

// Allow Enter key in history search
historyMemberId.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchHistoryBtn.click();
    }
});

// ============================================================
// Initialize
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("Borrowing page initialized");
});