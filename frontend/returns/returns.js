const lookupForm = document.querySelector("#lookupForm");
const lookupMessage = document.querySelector("#lookupMessage");

const returnForm = document.querySelector("#returnForm");
const returnMessage = document.querySelector("#returnMessage");

const returnItems = document.querySelector("#returnItems");
const returnResultTable = document.querySelector("#returnResultTable");

const returnBookCount = document.querySelector("#returnBookCount");
const totalFine = document.querySelector("#totalFine");
const ticketStatus = document.querySelector("#ticketStatus");

let currentTicketId = null;

/* ==========================
   Cập nhật số lượng sách
========================== */

function updateBookCount() {
    if (!returnBookCount) return;

    const count =
        returnItems.querySelectorAll(".return-item").length;

    returnBookCount.textContent = count;
}

/* ==========================
   Hiển thị sách chưa trả
========================== */

function renderBorrowedBooks(data) {

    returnItems.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {

        returnItems.innerHTML = `
            <div class="empty-state">
                Không có sách cần trả.
            </div>
        `;

        updateBookCount();
        return;
    }

    data.forEach(book => {

        const item = document.createElement("div");

        item.className = "return-item";

        item.innerHTML = `
            <div class="panel">

                <div class="field">
                    <label>Mã sách</label>
                    <input
                        class="book-id"
                        value="${book.MaSach}"
                        readonly>
                </div>

                <div class="field">
                    <label>Tên sách</label>
                    <input
                        value="${book.TenSach || ""}"
                        readonly>
                </div>

                <div class="field">
                    <label>Tình trạng trả</label>

                    <select class="book-condition">
                        <option value="BinhThuong">
                            Bình thường
                        </option>

                        <option value="HongNhe">
                            Hỏng nhẹ
                        </option>

                        <option value="HongNang">
                            Hỏng nặng
                        </option>

                        <option value="Mat">
                            Mất
                        </option>
                    </select>
                </div>

                <div class="field">
                    <label>Phí xử lý</label>

                    <input
                        class="book-fee"
                        type="number"
                        min="0"
                        value="0">
                </div>

            </div>
        `;

        returnItems.appendChild(item);
    });

    updateBookCount();
}

/* ==========================
   Tra cứu phiếu mượn
========================== */

async function lookupBorrowing(event) {

    event.preventDefault();

    hideMessage(lookupMessage);

    const ticketId =
        Number(document.querySelector("#ticketId").value);

    if (!ticketId) {

        showMessage(
            lookupMessage,
            "error",
            "Vui lòng nhập mã phiếu mượn."
        );

        return;
    }

    currentTicketId = ticketId;

    try {

        const data =
            await apiRequest(
                `/returns/${ticketId}`
            );

        if (!Array.isArray(data)) {
            throw new Error(
                "Dữ liệu trả về không hợp lệ."
            );
        }

        renderBorrowedBooks(data);

        showMessage(
            lookupMessage,
            "success",
            `Đã tải ${data.length} cuốn sách chưa trả.`
        );

    } catch (error) {

        showMessage(
            lookupMessage,
            "error",
            error.message
        );
    }
}

/* ==========================
   Lấy dữ liệu trả sách
========================== */

function getReturnItems() {

    return [
        ...returnItems.querySelectorAll(".return-item")
    ].map(item => ({

        ma_sach:
            Number(
                item.querySelector(".book-id").value
            ),

        tinh_trang_tra:
            item.querySelector(
                ".book-condition"
            ).value,

        phi_xu_ly:
            Number(
                item.querySelector(".book-fee").value
            ) || 0
    }));
}

/* ==========================
   Ghi nhận trả sách
========================== */

async function submitReturn(event) {

    event.preventDefault();

    hideMessage(returnMessage);

    if (
        !currentTicketId ||
        !returnItems.querySelector(".return-item")
    ) {

        showMessage(
            returnMessage,
            "error",
            "Vui lòng tải danh sách sách cần trả trước."
        );

        return;
    }

    try {

        const result =
            await apiRequest(
                `/returns/${currentTicketId}`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        ma_nhan_vien:
                            Number(
                                document.querySelector(
                                    "#returnStaffId"
                                ).value
                            ),

                        items:
                            getReturnItems()
                    })
                }
            );

        renderReturnResult(result);

        showMessage(
            returnMessage,
            "success",
            "Đã ghi nhận trả sách thành công."
        );

        returnItems.innerHTML = "";
        updateBookCount();

    } catch (error) {

        showMessage(
            returnMessage,
            "error",
            error.message
        );
    }
}

/* ==========================
   Hiển thị kết quả xử lý
========================== */

function renderReturnResult(data) {

    returnResultTable.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {

        returnResultTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Không có dữ liệu
                </td>
            </tr>
        `;

        return;
    }

    if (totalFine) {

        totalFine.textContent =
            formatMoney(
                data[0].TongTienPhat || 0
            );
    }

    if (ticketStatus) {

        ticketStatus.textContent =
            data[0].TrangThaiPhieu || "-";
    }

    data.forEach(item => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${item.MaSach}</td>
            <td>${item.TenSach}</td>
            <td>${item.NgayTre}</td>
            <td>${item.TinhTrangTra}</td>
            <td>${formatMoney(item.TienPhat)}</td>
        `;

        returnResultTable.appendChild(row);
    });
}

/* ==========================
   Khởi tạo
========================== */

lookupForm?.addEventListener(
    "submit",
    lookupBorrowing
);

returnForm?.addEventListener(
    "submit",
    submitReturn
);

updateBookCount();