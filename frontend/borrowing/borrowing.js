const borrowItems = document.querySelector("#borrowItems");

const reservationForm = document.querySelector("#reservationForm");
const reservationMessage = document.querySelector("#reservationMessage");

const pickupForm = document.querySelector("#pickupForm");
const pickupMessage = document.querySelector("#pickupMessage");

const borrowingTable = document.querySelector("#borrowingTable");

const statusFilter = document.querySelector("#statusFilter");
const refreshBorrowings = document.querySelector("#refreshBorrowings");

const totalBooks = document.querySelector("#totalBooks");

const ticketDetailTable =
    document.querySelector("#ticketDetailTable");

const loadTicketButton =
    document.querySelector("#loadTicketDetail");

/* ==========================
   Borrow Items
========================== */

function updateTotalBooks() {

    const total = getBorrowItems()
        .reduce(
            (sum, item) =>
                sum + (item.so_luong || 0),
            0
        );

    if (totalBooks) {

        totalBooks.textContent = total;

        totalBooks.style.color =
            total > 8
                ? "#dc2626"
                : "";
    }
}

function addBorrowItem(
    isbn = "",
    quantity = 1
) {

    const row =
        document.createElement("div");

    row.className = "borrow-item";

    row.innerHTML = `
        <input
            class="item-isbn"
            type="text"
            maxlength="20"
            placeholder="ISBN"
            value="${isbn}"
            required
        >

        <input
            class="item-quantity"
            type="number"
            min="1"
            value="${quantity}"
            required
        >

        <button
            type="button"
            class="secondary remove-item">
            Xóa
        </button>
    `;

    row.querySelector(".remove-item")
        .addEventListener("click", () => {

            if (
                borrowItems.children.length > 1
            ) {

                row.remove();

                updateTotalBooks();
            }
        });

    row.querySelector(".item-quantity")
        .addEventListener(
            "input",
            updateTotalBooks
        );

    borrowItems.appendChild(row);

    updateTotalBooks();
}

function getBorrowItems() {

    return [
        ...borrowItems.querySelectorAll(
            ".borrow-item"
        )
    ].map(row => ({
        isbn:
            row.querySelector(
                ".item-isbn"
            ).value.trim(),

        so_luong:
            Number(
                row.querySelector(
                    ".item-quantity"
                ).value
            )
    }));
}

/* ==========================
   Create Reservation
========================== */

async function submitReservation(
    event
) {

    event.preventDefault();

    hideMessage(
        reservationMessage
    );

    const items =
        getBorrowItems();

    const totalQuantity =
        items.reduce(
            (sum, item) =>
                sum + item.so_luong,
            0
        );

    if (totalQuantity > 8) {

        showMessage(
            reservationMessage,
            "error",
            "Mỗi phiếu không được quá 8 cuốn."
        );

        return;
    }

    try {

        const data =
            await apiRequest(
                "/borrowing",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            ma_doc_gia:
                                Number(
                                    document.querySelector(
                                        "#readerId"
                                    ).value
                                ),

                            so_ngay_muon:
                                Number(
                                    document.querySelector(
                                        "#borrowDays"
                                    ).value
                                ),

                            items
                        })
                }
            );

        const ticket =
            data?.[0];

        showMessage(
            reservationMessage,
            "success",

            ticket
                ? `Đã tạo phiếu #${ticket.MaPhieuMuon}`
                : "Đã tạo phiếu."
        );

        if (ticket) {

            document.querySelector(
                "#pickupTicketId"
            ).value =
                ticket.MaPhieuMuon;
        }

        reservationForm.reset();

        borrowItems.innerHTML = "";

        addBorrowItem();

        await loadBorrowingList();

    } catch (error) {

        showMessage(
            reservationMessage,
            "error",
            error.message
        );
    }
}

/* ==========================
   Pickup
========================== */

async function submitPickup(
    event
) {

    event.preventDefault();

    hideMessage(
        pickupMessage
    );

    const ticketId =
        Number(
            document.querySelector(
                "#pickupTicketId"
            ).value
        );

    try {

        const data =
            await apiRequest(
                `/borrowing/${ticketId}/pickup`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            ma_nhan_vien:
                                Number(
                                    document.querySelector(
                                        "#staffId"
                                    ).value
                                ),

                            so_ngay_muon:
                                Number(
                                    document.querySelector(
                                        "#pickupBorrowDays"
                                    ).value
                                )
                        })
                }
            );

        showMessage(
            pickupMessage,
            "success",
            `Đã xác nhận lấy ${data.length} cuốn sách.`
        );

        renderTicketDetail(
            data
        );

        await loadBorrowingList();

    } catch (error) {

        showMessage(
            pickupMessage,
            "error",
            error.message
        );
    }
}

/* ==========================
   Ticket Detail
========================== */

function renderTicketDetail(
    data
) {

    if (
        !ticketDetailTable
    ) {
        return;
    }

    ticketDetailTable.innerHTML = "";

    if (
        !data ||
        !data.length
    ) {

        ticketDetailTable.innerHTML =
            `
            <tr>
                <td colspan="4">
                    Không có dữ liệu
                </td>
            </tr>
        `;

        return;
    }

    data.forEach(item => {

        const row =
            document.createElement(
                "tr"
            );

        row.innerHTML = `
            <td>${item.MaSach}</td>
            <td>${item.ISBN}</td>
            <td>${item.TenSach}</td>
            <td>${formatDate(item.HanTra)}</td>
        `;

        ticketDetailTable.appendChild(
            row
        );
    });
}

async function loadTicketDetail() {

    const ticketId =
        Number(
            document.querySelector(
                "#pickupTicketId"
            ).value
        );

    if (!ticketId) {

        showMessage(
            pickupMessage,
            "error",
            "Vui lòng nhập mã phiếu."
        );

        return;
    }

    try {

        const data =
            await apiRequest(
                `/borrowing/${ticketId}`
            );

        renderTicketDetail(
            data
        );

    } catch (error) {

        showMessage(
            pickupMessage,
            "error",
            error.message
        );
    }
}

/* ==========================
   Borrowing List
========================== */

async function loadBorrowingList() {

    borrowingTable.innerHTML =
        "";

    try {

        const params =
            new URLSearchParams();

        if (
            statusFilter?.value
        ) {

            params.set(
                "trang_thai",
                statusFilter.value
            );
        }

        const query =
            params.toString()
                ? `?${params}`
                : "";

        const data =
            await apiRequest(
                `/borrowing${query}`
            );

        if (
            !data.length
        ) {

            borrowingTable.innerHTML =
                `
                <tr>
                    <td colspan="6">
                        Chưa có dữ liệu
                    </td>
                </tr>
            `;

            return;
        }

        data.forEach(
            ticket => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        ${ticket.MaPhieuMuon}
                    </td>

                    <td>
                        ${ticket.MaDocGia}
                    </td>

                    <td>
                        ${formatDateTime(
                            ticket.NgayTaoPhieu
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            ticket.NgayHetHanGiuSach
                        )}
                    </td>

                    <td>
                        ${ticket.TrangThai}
                    </td>

                    <td>
                        ${ticket.TongSoCuon || 0}
                    </td>
                `;

                borrowingTable
                    .appendChild(
                        row
                    );
            }
        );

    } catch (error) {

        borrowingTable.innerHTML =
            `
            <tr>
                <td colspan="6">
                    Không tải được dữ liệu
                </td>
            </tr>
        `;
    }
}

/* ==========================
   Events
========================== */

document
.querySelector(
    "#addBorrowItem"
)
.addEventListener(
    "click",
    () => addBorrowItem()
);

reservationForm
?.addEventListener(
    "submit",
    submitReservation
);

pickupForm
?.addEventListener(
    "submit",
    submitPickup
);

statusFilter
?.addEventListener(
    "change",
    loadBorrowingList
);

refreshBorrowings
?.addEventListener(
    "click",
    loadBorrowingList
);

loadTicketButton
?.addEventListener(
    "click",
    loadTicketDetail
);

/* ==========================
   Init
========================== */

addBorrowItem();

loadBorrowingList();