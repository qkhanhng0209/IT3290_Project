const reportMessage = document.querySelector("#reportMessage");
const refreshReportsBtn = document.querySelector("#refreshReportsBtn");
const tabButtons = document.querySelectorAll("[data-report-target]");
const reportPanels = document.querySelectorAll(".panel");

const totalTitles = document.querySelector("#totalTitles");
const totalCopies = document.querySelector("#totalCopies");
const borrowedCopies = document.querySelector("#borrowedCopies");
const damagedCopies = document.querySelector("#damagedCopies");

const categoryReportBody = document.querySelector("#categoryReportBody");
const publisherReportBody = document.querySelector("#publisherReportBody");
const authorReportBody = document.querySelector("#authorReportBody");
const inventoryReportBody = document.querySelector("#inventoryReportBody");
const topBooksReportBody = document.querySelector("#topBooksReportBody");
const topReadersReportBody = document.querySelector("#topReadersReportBody");

function isLoggedIn() {
    return Boolean(localStorage.getItem("authUser") && localStorage.getItem("authRole"));
}

function showMessage(type, text) {
    reportMessage.className = `message ${type}`;
    reportMessage.textContent = text;
}

function hideMessage() {
    reportMessage.className = "message";
    reportMessage.textContent = "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}

function setLoading(tbody, colspan) {
    tbody.innerHTML = `
        <tr>
            <td colspan="${colspan}">Đang tải dữ liệu...</td>
        </tr>
    `;
}

function setEmpty(tbody, colspan) {
    tbody.innerHTML = `
        <tr>
            <td colspan="${colspan}">Chưa có dữ liệu.</td>
        </tr>
    `;
}

function renderRows(tbody, data, colspan, buildCells) {
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        setEmpty(tbody, colspan);
        return;
    }

    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = buildCells(item);
        tbody.appendChild(row);
    });
}

function switchReport(targetId) {
    tabButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.reportTarget === targetId
        );
    });

    reportPanels.forEach(panel => {
        panel.classList.toggle("active", panel.id === targetId);
    });
}

function renderCategoryReport(data) {
    renderRows(categoryReportBody, data, 3, item => `
        <td>${escapeHtml(item.ten_the_loai)}</td>
        <td>${formatNumber(item.so_luong_dau_sach)}</td>
        <td>${formatNumber(item.tong_so_cuon)}</td>
    `);
}

function renderPublisherReport(data) {
    renderRows(publisherReportBody, data, 3, item => `
        <td>${escapeHtml(item.ten_nxb)}</td>
        <td>${formatNumber(item.so_luong_dau_sach)}</td>
        <td>${formatNumber(item.tong_so_cuon)}</td>
    `);
}

function renderAuthorReport(data) {
    renderRows(authorReportBody, data, 3, item => `
        <td>${escapeHtml(item.ten_tac_gia)}</td>
        <td>${formatNumber(item.so_luong_dau_sach)}</td>
        <td>${formatNumber(item.tong_so_cuon)}</td>
    `);
}

function renderInventoryReport(data) {
    renderRows(inventoryReportBody, data, 8, item => `
        <td>${escapeHtml(item.isbn)}</td>
        <td>${escapeHtml(item.ten_sach)}</td>
        <td>${formatNumber(item.tong_so_cuon)}</td>
        <td>${formatNumber(item.so_cuon_tot)}</td>
        <td>${formatNumber(item.so_cuon_dang_muon)}</td>
        <td>${formatNumber(item.so_cuon_hong_nhe)}</td>
        <td>${formatNumber(item.so_cuon_hong_nang)}</td>
        <td>${formatNumber(item.so_cuon_mat)}</td>
    `);
}

function renderTopBooksReport(data) {
    renderRows(topBooksReportBody, data, 3, item => `
        <td>${escapeHtml(item.isbn)}</td>
        <td>${escapeHtml(item.ten_sach)}</td>
        <td>${formatNumber(item.so_luot_muon)}</td>
    `);
}

function renderTopReadersReport(data) {
    renderRows(topReadersReportBody, data, 3, item => `
        <td>${escapeHtml(item.ma_doc_gia)}</td>
        <td>${escapeHtml(item.ho_ten)}</td>
        <td>${formatNumber(item.tong_so_sach_muon)}</td>
    `);
}

function renderSummary(inventory) {
    const rows = Array.isArray(inventory) ? inventory : [];

    const totals = rows.reduce(
        (summary, item) => {
            summary.titles += 1;
            summary.copies += Number(item.tong_so_cuon || 0);
            summary.borrowed += Number(item.so_cuon_dang_muon || 0);
            summary.damaged +=
                Number(item.so_cuon_hong_nhe || 0) +
                Number(item.so_cuon_hong_nang || 0) +
                Number(item.so_cuon_mat || 0);

            return summary;
        },
        {
            titles: 0,
            copies: 0,
            borrowed: 0,
            damaged: 0
        }
    );

    totalTitles.textContent = formatNumber(totals.titles);
    totalCopies.textContent = formatNumber(totals.copies);
    borrowedCopies.textContent = formatNumber(totals.borrowed);
    damagedCopies.textContent = formatNumber(totals.damaged);
}

function setAllLoading() {
    setLoading(categoryReportBody, 3);
    setLoading(publisherReportBody, 3);
    setLoading(authorReportBody, 3);
    setLoading(inventoryReportBody, 8);
    setLoading(topBooksReportBody, 3);
    setLoading(topReadersReportBody, 3);

    totalTitles.textContent = "-";
    totalCopies.textContent = "-";
    borrowedCopies.textContent = "-";
    damagedCopies.textContent = "-";
}

async function loadReports() {
    if (!isLoggedIn()) {
        setEmpty(categoryReportBody, 3);
        setEmpty(publisherReportBody, 3);
        setEmpty(authorReportBody, 3);
        setEmpty(inventoryReportBody, 8);
        setEmpty(topBooksReportBody, 3);
        setEmpty(topReadersReportBody, 3);

        totalTitles.textContent = "-";
        totalCopies.textContent = "-";
        borrowedCopies.textContent = "-";
        damagedCopies.textContent = "-";
        showMessage("error", "Vui lòng đăng nhập để xem thống kê thư viện.");
        return;
    }

    hideMessage();
    setAllLoading();

    try {
        const [
            category,
            publisher,
            author,
            inventory,
            topBooks,
            topReaders
        ] = await Promise.all([
            apiRequest("/reports/books-by-category"),
            apiRequest("/reports/books-by-publisher"),
            apiRequest("/reports/books-by-author"),
            apiRequest("/reports/inventory"),
            apiRequest("/reports/top-books"),
            apiRequest("/reports/top-readers")
        ]);

        renderCategoryReport(category);
        renderPublisherReport(publisher);
        renderAuthorReport(author);
        renderInventoryReport(inventory);
        renderTopBooksReport(topBooks);
        renderTopReadersReport(topReaders);
        renderSummary(inventory);

        showMessage("success", "Đã tải báo cáo thành công.");
    } catch (error) {
        setEmpty(categoryReportBody, 3);
        setEmpty(publisherReportBody, 3);
        setEmpty(authorReportBody, 3);
        setEmpty(inventoryReportBody, 8);
        setEmpty(topBooksReportBody, 3);
        setEmpty(topReadersReportBody, 3);

        showMessage("error", error.message);
    }
}

tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        switchReport(button.dataset.reportTarget);
    });
});

refreshReportsBtn.addEventListener("click", loadReports);

loadReports();
