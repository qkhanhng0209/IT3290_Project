const bookMessage = document.querySelector("#bookMessage");
const searchForm = document.querySelector("#searchForm");
const searchType = document.querySelector("#searchType");
const searchKeyword = document.querySelector("#searchKeyword");
const resetSearchBtn = document.querySelector("#resetSearchBtn");
const newBookBtn = document.querySelector("#newBookBtn");
const bookForm = document.querySelector("#bookForm");
const formTitle = document.querySelector("#formTitle");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const booksTableBody = document.querySelector("#booksTableBody");

const isbnInput = document.querySelector("#isbn");
const tenSachInput = document.querySelector("#tenSach");
const tenNxbInput = document.querySelector("#tenNxb");
const namXuatBanInput = document.querySelector("#namXuatBan");
const soTrangInput = document.querySelector("#soTrang");
const giaBiaInput = document.querySelector("#giaBia");
const tacGiaInput = document.querySelector("#tacGia");
const theLoaiInput = document.querySelector("#theLoai");
const moTaInput = document.querySelector("#moTa");

let books = [];
let editingIsbn = null;

// Login thật chưa hoàn thiện, nên frontend tạm đọc role từ localStorage.
// Quy ước: reader/staff chỉ xem, admin/manager/QuanLy được thêm-sửa-xóa.
function getCurrentRole() {
    return localStorage.getItem("userRole") || "reader";
}

function canManageBooks() {
    const role = getCurrentRole().toLowerCase();

    return [
        "admin",
        "manager",
        "quanly",
        "quan_ly",
        "quản lý"
    ].includes(role);
}

function showMessage(type, text) {
    bookMessage.className = `message ${type}`;
    bookMessage.textContent = text;
}

function hideMessage() {
    bookMessage.className = "message";
    bookMessage.textContent = "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(value) {
    const amount = Number(value || 0);

    return amount.toLocaleString("vi-VN") + " đ";
}

function splitList(value) {
    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

function applyPermissionUI() {
    if (canManageBooks()) {
        return;
    }

    newBookBtn.style.display = "none";
    bookForm.style.display = "none";
    formTitle.textContent = "Thông tin quyền truy cập";

    const note = document.createElement("p");
    note.className = "muted";
    note.textContent =
        "Bạn đang ở chế độ xem. Chỉ quản lý mới được thêm, sửa hoặc xóa sách.";

    formTitle.insertAdjacentElement("afterend", note);
}

function renderBooks(data) {
    booksTableBody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        booksTableBody.innerHTML = `
            <tr>
                <td colspan="9">Không có dữ liệu sách.</td>
            </tr>
        `;
        return;
    }

    data.forEach(book => {
        const isbn = book.isbn || "";
        const encodedIsbn = encodeURIComponent(isbn);

        const actionCell = canManageBooks()
            ? `
                <div class="actions">
                    <button
                        class="btn btn-primary btn-edit"
                        type="button"
                        data-isbn="${encodedIsbn}">
                        Sửa
                    </button>
                    <button
                        class="btn btn-danger btn-delete"
                        type="button"
                        data-isbn="${encodedIsbn}">
                        Xóa
                    </button>
                </div>
            `
            : `<span class="muted">Chỉ xem</span>`;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(isbn)}</td>
            <td>${escapeHtml(book.ten_sach)}</td>
            <td>${escapeHtml(book.nha_xuat_ban)}</td>
            <td>${escapeHtml(book.nam_xuat_ban)}</td>
            <td>${formatMoney(book.gia_bia)}</td>
            <td>${escapeHtml(book.so_luong)}</td>
            <td>${escapeHtml(book.tac_gia || "")}</td>
            <td>${escapeHtml(book.the_loai || "")}</td>
            <td>${actionCell}</td>
        `;

        booksTableBody.appendChild(row);
    });
}

async function loadBooks() {
    hideMessage();

    booksTableBody.innerHTML = `
        <tr>
            <td colspan="9">Đang tải dữ liệu...</td>
        </tr>
    `;

    try {
        books = await window.API.books.getBooks();
        renderBooks(books);
    } catch (error) {
        booksTableBody.innerHTML = `
            <tr>
                <td colspan="9">Không tải được dữ liệu sách.</td>
            </tr>
        `;

        showMessage("error", error.message);
    }
}

async function handleSearch(event) {
    event.preventDefault();
    hideMessage();

    const keyword = searchKeyword.value.trim();
    const type = searchType.value;

    if (!keyword) {
        await loadBooks();
        return;
    }

    try {
        books = await window.API.books.searchBooks(keyword, type);
        renderBooks(books);
    } catch (error) {
        renderBooks([]);
        showMessage("error", error.message);
    }
}

function getFormPayload() {
    return {
        isbn: isbnInput.value.trim(),
        ten_sach: tenSachInput.value.trim(),
        ten_nxb: tenNxbInput.value.trim(),
        nam_xuat_ban: Number(namXuatBanInput.value),
        so_trang: soTrangInput.value ? Number(soTrangInput.value) : null,
        mo_ta: moTaInput.value.trim() || null,
        gia_bia: Number(giaBiaInput.value),
        tac_gia: splitList(tacGiaInput.value),
        the_loai: splitList(theLoaiInput.value)
    };
}

function resetForm() {
    editingIsbn = null;
    bookForm.reset();
    isbnInput.readOnly = false;
    formTitle.textContent = "Thêm sách";
}

function fillForm(book) {
    editingIsbn = book.isbn;

    formTitle.textContent = "Cập nhật sách";
    isbnInput.value = book.isbn || "";
    isbnInput.readOnly = true;
    tenSachInput.value = book.ten_sach || "";
    tenNxbInput.value = book.nha_xuat_ban || "";
    namXuatBanInput.value = book.nam_xuat_ban || "";
    soTrangInput.value = book.so_trang || "";
    giaBiaInput.value = book.gia_bia || "";
    tacGiaInput.value = book.tac_gia || "";
    theLoaiInput.value = book.the_loai || "";
    moTaInput.value = book.mo_ta || "";

    bookForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function handleSubmit(event) {
    event.preventDefault();
    hideMessage();

    if (!canManageBooks()) {
        showMessage("error", "Bạn không có quyền thay đổi dữ liệu sách.");
        return;
    }

    const payload = getFormPayload();

    try {
        if (editingIsbn) {
            await window.API.books.updateBook(editingIsbn, payload);
            showMessage("success", "Cập nhật sách thành công.");
        } else {
            await window.API.books.addBook(payload);
            showMessage("success", "Thêm sách thành công.");
        }

        resetForm();
        await loadBooks();
    } catch (error) {
        showMessage("error", error.message);
    }
}

async function handleTableClick(event) {
    const editButton = event.target.closest(".btn-edit");
    const deleteButton = event.target.closest(".btn-delete");

    if (!editButton && !deleteButton) {
        return;
    }

    if (!canManageBooks()) {
        showMessage("error", "Bạn không có quyền thực hiện thao tác này.");
        return;
    }

    const encodedIsbn = editButton?.dataset.isbn || deleteButton?.dataset.isbn;
    const isbn = decodeURIComponent(encodedIsbn);

    if (editButton) {
        const book = books.find(item => item.isbn === isbn);

        if (!book) {
            showMessage("error", "Không tìm thấy sách trong danh sách hiện tại.");
            return;
        }

        fillForm(book);
        return;
    }

    const confirmed = confirm(`Bạn có chắc muốn xóa đầu sách ISBN ${isbn}?`);

    if (!confirmed) {
        return;
    }

    try {
        await window.API.books.deleteBook(isbn);
        showMessage("success", "Xóa sách thành công.");
        await loadBooks();
    } catch (error) {
        showMessage("error", error.message);
    }
}

searchForm.addEventListener("submit", handleSearch);

resetSearchBtn.addEventListener("click", async () => {
    searchKeyword.value = "";
    searchType.value = "all";
    await loadBooks();
});

newBookBtn.addEventListener("click", () => {
    resetForm();
    hideMessage();
});

cancelEditBtn.addEventListener("click", () => {
    resetForm();
    hideMessage();
});

bookForm.addEventListener("submit", handleSubmit);
booksTableBody.addEventListener("click", handleTableClick);

applyPermissionUI();
loadBooks();
