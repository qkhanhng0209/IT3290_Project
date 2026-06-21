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
const copyPanel = document.querySelector("#copyPanel");
const copyTarget = document.querySelector("#copyTarget");
const copyForm = document.querySelector("#copyForm");
const cancelCopyBtn = document.querySelector("#cancelCopyBtn");
const copiesPanel = document.querySelector("#copiesPanel");
const copiesTitle = document.querySelector("#copiesTitle");
const copiesTableBody = document.querySelector("#copiesTableBody");

const isbnInput = document.querySelector("#isbn");
const tenSachInput = document.querySelector("#tenSach");
const tenNxbInput = document.querySelector("#tenNxb");
const namXuatBanInput = document.querySelector("#namXuatBan");
const soTrangInput = document.querySelector("#soTrang");
const giaBiaInput = document.querySelector("#giaBia");
const tacGiaInput = document.querySelector("#tacGia");
const theLoaiInput = document.querySelector("#theLoai");
const moTaInput = document.querySelector("#moTa");
const copyQuantityInput = document.querySelector("#copyQuantity");
const copyStatusInput = document.querySelector("#copyStatus");
const copyCompensationInput = document.querySelector("#copyCompensation");

let books = [];
let editingIsbn = null;
let activeCopyIsbn = null;
let activeCopiesIsbn = null;

// Đọc trạng thái đăng nhập chung do trang login lưu vào localStorage.
function isLoggedIn() {
  return Boolean(localStorage.getItem("authUser") && localStorage.getItem("authRole"));
}

function getCurrentRole() {
  return localStorage.getItem("authRole") || "";
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "null");
  } catch (error) {
    return null;
  }
}

function canManageBooks() {
  const role = getCurrentRole().toLowerCase();
  const user = getAuthUser();
  const position = String(user?.ChucVu || user?.chucVu || "").toLowerCase();

  return ["admin", "manager", "quanly", "quan_ly", "quản lý"].includes(role)
    || position === "quanly"
    || position === "quản lý";
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

function getStatusLabel(status) {
  const labels = {
    Tot: "Tốt",
    HongNhe: "Hỏng nhẹ",
    HongNang: "Hỏng nặng",
    Mat: "Mất",
    DangMuon: "Đang mượn",
  };

  return labels[status] || status;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyPermissionUI() {
  if (!isLoggedIn()) {
    newBookBtn.style.display = "none";
    bookForm.style.display = "none";
    copyPanel.hidden = true;
    copiesPanel.hidden = true;
    searchForm.style.display = "none";
    formTitle.textContent = "Vui lòng đăng nhập";
    booksTableBody.innerHTML = `
            <tr>
                <td colspan="9">Bạn cần đăng nhập để xem danh sách sách.</td>
            </tr>
        `;
    showMessage("error", "Vui lòng đăng nhập để xem sách và thống kê thư viện.");
    return;
  }

  if (canManageBooks()) {
    return;
  }

  newBookBtn.style.display = "none";
  bookForm.style.display = "none";
  copyPanel.hidden = true;
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

  data.forEach((book) => {
    const isbn = book.isbn || "";
    const encodedIsbn = encodeURIComponent(isbn);

        const actionCell = canManageBooks()
            ? `
                <div class="actions">
                    <button
                        class="btn btn-warning btn-view-copies"
                        type="button"
                        data-isbn="${encodedIsbn}">
                        Xem cuốn
                    </button>
                    <button
                        class="btn btn-success btn-add-copy"
                        type="button"
                        data-isbn="${encodedIsbn}">
                        Thêm cuốn
                    </button>
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

function renderCopies(copies) {
  copiesTableBody.innerHTML = "";

  if (!Array.isArray(copies) || copies.length === 0) {
    copiesTableBody.innerHTML = `
            <tr>
                <td colspan="5">Đầu sách này chưa có cuốn vật lý nào.</td>
            </tr>
        `;
    return;
  }

  copies.forEach((copy) => {
    const row = document.createElement("tr");
    const status = copy.tinh_trang || "Tot";
    const compensation = Number(copy.he_so_den_bu || 1.2);

    row.innerHTML = `
            <td>${escapeHtml(copy.ma_sach)}</td>
            <td>${escapeHtml(copy.isbn)}</td>
            <td>
                <select class="copy-status-select" data-ma-sach="${copy.ma_sach}">
                    ${["Tot", "HongNhe", "HongNang", "Mat", "DangMuon"]
                      .map(
                        (option) => `
                            <option value="${option}" ${option === status ? "selected" : ""}>
                                ${getStatusLabel(option)}
                            </option>
                        `
                      )
                      .join("")}
                </select>
            </td>
            <td>
                <input
                    class="copy-compensation-input"
                    data-ma-sach="${copy.ma_sach}"
                    type="number"
                    min="1"
                    step="0.1"
                    value="${escapeHtml(compensation)}">
            </td>
            <td>
                <button
                    class="btn btn-primary btn-save-copy"
                    type="button"
                    data-ma-sach="${copy.ma_sach}">
                    Lưu
                </button>
            </td>
        `;

    copiesTableBody.appendChild(row);
  });
}

async function loadBookCopies(book) {
  activeCopiesIsbn = book.isbn;
  copiesPanel.hidden = false;
  copiesTitle.textContent = `Đầu sách: ${book.ten_sach || ""} | ISBN: ${book.isbn}`;
  copiesTableBody.innerHTML = `
        <tr>
            <td colspan="5">Đang tải danh sách cuốn vật lý...</td>
        </tr>
    `;

  try {
    const copies = await window.API.books.getBookCopies(book.isbn);
    renderCopies(copies);
  } catch (error) {
    copiesTableBody.innerHTML = `
            <tr>
                <td colspan="5">Không tải được danh sách cuốn vật lý.</td>
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
    the_loai: splitList(theLoaiInput.value),
  };
}

function resetForm() {
  editingIsbn = null;
  bookForm.reset();
  isbnInput.readOnly = false;
  formTitle.textContent = "Thêm sách";
}

function resetCopyForm() {
  activeCopyIsbn = null;
  copyPanel.hidden = true;
  copyForm.reset();
  copyQuantityInput.value = 1;
  copyStatusInput.value = "Tot";
  copyCompensationInput.value = 1.2;
  copyTarget.textContent = "";
}

function openCopyForm(book) {
  activeCopyIsbn = book.isbn;
  copyTarget.textContent = `Đầu sách: ${book.ten_sach || ""} | ISBN: ${book.isbn}`;
  copyPanel.hidden = false;
  copyQuantityInput.focus();

  copyPanel.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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
    block: "start",
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
  const viewCopiesButton = event.target.closest(".btn-view-copies");
  const addCopyButton = event.target.closest(".btn-add-copy");
  const editButton = event.target.closest(".btn-edit");
  const deleteButton = event.target.closest(".btn-delete");

  if (!viewCopiesButton && !addCopyButton && !editButton && !deleteButton) {
    return;
  }

  if (!canManageBooks()) {
    showMessage("error", "Bạn không có quyền thực hiện thao tác này.");
    return;
  }

  const encodedIsbn =
    viewCopiesButton?.dataset.isbn ||
    addCopyButton?.dataset.isbn ||
    editButton?.dataset.isbn ||
    deleteButton?.dataset.isbn;
  const isbn = decodeURIComponent(encodedIsbn);
  const book = books.find((item) => item.isbn === isbn);

  if (viewCopiesButton) {
    if (!book) {
      showMessage("error", "Không tìm thấy sách trong danh sách hiện tại.");
      return;
    }

    await loadBookCopies(book);
    return;
  }

  if (addCopyButton) {
    if (!book) {
      showMessage("error", "Không tìm thấy sách trong danh sách hiện tại.");
      return;
    }

    openCopyForm(book);
    return;
  }

  if (editButton) {
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

async function handleCopySubmit(event) {
  event.preventDefault();
  hideMessage();

  if (!canManageBooks()) {
    showMessage("error", "Bạn không có quyền thêm cuốn sách vật lý.");
    return;
  }

  if (!activeCopyIsbn) {
    showMessage("error", "Vui lòng chọn đầu sách trước khi thêm cuốn.");
    return;
  }

  const payload = {
    so_luong: Number(copyQuantityInput.value),
    tinh_trang: copyStatusInput.value,
    he_so_den_bu: Number(copyCompensationInput.value),
  };

  try {
    await window.API.books.addBookCopies(activeCopyIsbn, payload);
    showMessage("success", "Thêm cuốn sách vật lý thành công.");
    const addedCopyIsbn = activeCopyIsbn;
    resetCopyForm();
    await loadBooks();

    if (activeCopiesIsbn === addedCopyIsbn) {
      const book = books.find((item) => item.isbn === addedCopyIsbn);
      if (book) {
        await loadBookCopies(book);
      }
    }
  } catch (error) {
    showMessage("error", error.message);
  }
}

async function handleCopiesTableClick(event) {
  const saveButton = event.target.closest(".btn-save-copy");

  if (!saveButton) {
    return;
  }

  if (!canManageBooks()) {
    showMessage("error", "Bạn không có quyền cập nhật cuốn sách vật lý.");
    return;
  }

  const maSach = saveButton.dataset.maSach;
  const statusInput = copiesTableBody.querySelector(
    `.copy-status-select[data-ma-sach="${maSach}"]`
  );
  const compensationInput = copiesTableBody.querySelector(
    `.copy-compensation-input[data-ma-sach="${maSach}"]`
  );

  const payload = {
    tinh_trang: statusInput.value,
    he_so_den_bu: Number(compensationInput.value),
  };

  try {
    await window.API.books.updateBookCopy(maSach, payload);
    showMessage("success", "Cập nhật cuốn sách vật lý thành công.");

    if (activeCopiesIsbn) {
      const book = books.find((item) => item.isbn === activeCopiesIsbn);
      if (book) {
        await loadBookCopies(book);
      }
    }

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
  resetCopyForm();
  hideMessage();
});

cancelEditBtn.addEventListener("click", () => {
  resetForm();
  hideMessage();
});

bookForm.addEventListener("submit", handleSubmit);
copyForm.addEventListener("submit", handleCopySubmit);
cancelCopyBtn.addEventListener("click", () => {
  resetCopyForm();
  hideMessage();
});
booksTableBody.addEventListener("click", handleTableClick);
copiesTableBody.addEventListener("click", handleCopiesTableClick);

applyPermissionUI();
if (isLoggedIn()) {
  loadBooks();
}
