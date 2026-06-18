// ============================================================
// RETURNS.JS - Complete Returns Module Management  
// ============================================================

// ============================================================
// UTILITY FUNCTIONS (DEFINE FIRST)
// ============================================================

function showMessage(elementId, type, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.className = 'message ' + type;
    element.textContent = message;
    
    if (type === 'success') {
        setTimeout(() => hideMessage(elementId), 3000);
    }
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.className = 'message';
    element.textContent = '';
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

function formatMoney(amount) {
    if (!amount) return '0 VND';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function getConditionBadge(condition) {
    let badgeClass = '';
    let conditionText = '';
    
    if (condition === 'BinhThuong') {
        badgeClass = 'badge-normal';
        conditionText = 'Binh thuong';
    } else if (condition === 'HongNhe') {
        badgeClass = 'badge-light';
        conditionText = 'Hong nhe';
    } else if (condition === 'HongNang') {
        badgeClass = 'badge-heavy';
        conditionText = 'Hong nang';
    } else if (condition === 'Mat') {
        badgeClass = 'badge-lost';
        conditionText = 'Mat sach';
    }
    
    return '<span class="badge ' + badgeClass + '">' + conditionText + '</span>';
}

// ============================================================
// LOOKUP FUNCTIONS
// ============================================================

async function performLookup() {
    const lookupTicketIdInput = document.getElementById('lookupTicketId');
    const lookupMessage = document.getElementById('lookupMessage');
    const lookupResult = document.getElementById('lookupResult');
    const lookupMemberId = document.getElementById('lookupMemberId');
    const lookupMemberName = document.getElementById('lookupMemberName');
    const lookupBookCount = document.getElementById('lookupBookCount');
    const lookupBooksTable = document.getElementById('lookupBooksTable');
    
    const ticketId = lookupTicketIdInput.value.trim();
    
    if (!ticketId) {
        showMessage('lookupMessage', 'error', 'Vui long nhap ma phieu muon');
        return;
    }
    
    hideMessage('lookupMessage');
    
    try {
        const result = await apiRequest('/returns/borrowed?ticket_id=' + ticketId);
        
        const phieu = result.phieu_muon;
        const books = result.books || [];
        
        if (lookupMemberId) lookupMemberId.textContent = phieu.ma_doc_gia;
        if (lookupMemberName) lookupMemberName.textContent = escapeHtml(phieu.ten_doc_gia);
        if (lookupBookCount) lookupBookCount.textContent = books.length;
        
        let booksHtml = '';
        if (books.length === 0) {
            booksHtml = '<tr><td colspan="5" class="empty-state">Khong co sach can tra</td></tr>';
        } else {
            books.forEach(book => {
                const daysOverdue = book.so_ngay_qua_han > 0 ? book.so_ngay_qua_han : 0;
                const overdueHtml = daysOverdue > 0 
                    ? '<span class="badge badge-overdue">' + daysOverdue + ' ngay qua han</span>'
                    : '<span style="color: #27ae60; font-weight: 600;">Con ' + book.so_ngay_con_lai + ' ngay</span>';
                
                booksHtml += '<tr>' +
                    '<td>' + escapeHtml(book.ma_sach) + '</td>' +
                    '<td>' + escapeHtml(book.isbn) + '</td>' +
                    '<td>' + escapeHtml(book.ten_sach) + '</td>' +
                    '<td>' + formatDate(book.han_tra) + '</td>' +
                    '<td>' + overdueHtml + '</td>' +
                    '</tr>';
            });
        }
        
        if (lookupBooksTable) {
            lookupBooksTable.innerHTML = booksHtml;
            lookupResult.style.display = 'block';
        }
        
        showMessage('lookupMessage', 'success', 'Tra cuu thanh cong');
    } catch (error) {
        console.error('Error in lookup:', error);
        showMessage('lookupMessage', 'error', 'Loi: ' + error.message);
        if (lookupResult) lookupResult.style.display = 'none';
    }
}

// ============================================================
// RECORD RETURN FUNCTIONS
// ============================================================

let recordBooks = [];

async function performRecordLoad() {
    const recordTicketIdInput = document.getElementById('recordTicketId');
    const recordMessage = document.getElementById('recordMessage');
    const recordBooksSection = document.getElementById('recordBooksSection');
    const recordMemberName = document.getElementById('recordMemberName');
    const recordBookCount = document.getElementById('recordBookCount');
    
    const ticketId = recordTicketIdInput.value.trim();
    
    if (!ticketId) {
        showMessage('recordMessage', 'error', 'Vui long nhap ma phieu muon');
        return;
    }
    
    hideMessage('recordMessage');
    
    try {
        const result = await apiRequest('/returns/borrowed?ticket_id=' + ticketId);
        
        const phieu = result.phieu_muon;
        const books = result.books || [];
        
        if (books.length === 0) {
            showMessage('recordMessage', 'error', 'Khong co sach can tra');
            recordBooksSection.style.display = 'none';
            return;
        }
        
        recordBooks = books.map(book => ({
            ma_sach: book.ma_sach,
            ten_sach: book.ten_sach,
            tinh_trang_tra: 'BinhThuong',
            phi_xu_ly: 0
        }));
        
        if (recordMemberName) recordMemberName.textContent = escapeHtml(phieu.ten_doc_gia);
        if (recordBookCount) recordBookCount.textContent = books.length;
        
        renderRecordBooks();
        recordBooksSection.style.display = 'block';
        const recordResult = document.getElementById('recordResult');
        if (recordResult) recordResult.style.display = 'none';
        
        showMessage('recordMessage', 'success', 'Tai danh sach thanh cong');
    } catch (error) {
        console.error('Error in recordLoad:', error);
        showMessage('recordMessage', 'error', 'Loi: ' + error.message);
        recordBooksSection.style.display = 'none';
    }
}

function renderRecordBooks() {
    const recordBooksContainer = document.getElementById('recordBooksContainer');
    let html = '';
    recordBooks.forEach((book, index) => {
        html += '<div class="book-item">' +
            '<div>' +
            '<div class="book-item-label">Ten sach</div>' +
            '<input type="text" value="' + escapeHtml(book.ten_sach) + '" readonly>' +
            '</div>' +
            '<div>' +
            '<div class="book-item-label">Tinh trang</div>' +
            '<select onchange="updateRecordBook(' + index + ', \'tinh_trang_tra\', this.value)">' +
            '<option value="BinhThuong" ' + (book.tinh_trang_tra === 'BinhThuong' ? 'selected' : '') + '>Binh thuong</option>' +
            '<option value="HongNhe" ' + (book.tinh_trang_tra === 'HongNhe' ? 'selected' : '') + '>Hong nhe</option>' +
            '<option value="HongNang" ' + (book.tinh_trang_tra === 'HongNang' ? 'selected' : '') + '>Hong nang</option>' +
            '<option value="Mat" ' + (book.tinh_trang_tra === 'Mat' ? 'selected' : '') + '>Mat sach</option>' +
            '</select>' +
            '</div>' +
            '<div>' +
            '<div class="book-item-label">Phi xu ly (VND)</div>' +
            '<input type="number" value="' + book.phi_xu_ly + '" min="0" onchange="updateRecordBook(' + index + ', \'phi_xu_ly\', this.value)">' +
            '</div>' +
            '<button class="btn btn-danger btn-sm" type="button" onclick="removeRecordBook(' + index + ')">Xoa</button>' +
            '</div>';
    });
    if (recordBooksContainer) {
        recordBooksContainer.innerHTML = html;
    }
}

function updateRecordBook(index, field, value) {
    if (field === 'tinh_trang_tra') {
        recordBooks[index].tinh_trang_tra = value;
    } else if (field === 'phi_xu_ly') {
        recordBooks[index].phi_xu_ly = parseInt(value) || 0;
    }
}

function removeRecordBook(index) {
    recordBooks.splice(index, 1);
    const recordBooksSection = document.getElementById('recordBooksSection');
    const recordResult = document.getElementById('recordResult');
    if (recordBooks.length === 0) {
        recordBooksSection.style.display = 'none';
        if (recordResult) recordResult.style.display = 'none';
    } else {
        renderRecordBooks();
    }
    showMessage('recordMessage', 'info', 'Da xoa sach khoi danh sach');
}

async function performRecordSubmit() {
    const recordTicketIdInput = document.getElementById('recordTicketId');
    const recordStaffIdInput = document.getElementById('recordStaffId');
    const recordMessage = document.getElementById('recordMessage');
    const recordBooksSection = document.getElementById('recordBooksSection');
    const recordResult = document.getElementById('recordResult');
    const resultTicketId = document.getElementById('resultTicketId');
    const resultReturnDate = document.getElementById('resultReturnDate');
    const resultTotalFine = document.getElementById('resultTotalFine');
    
    const ticketId = recordTicketIdInput.value.trim();
    const staffId = recordStaffIdInput.value.trim();
    
    if (!ticketId || !staffId) {
        showMessage('recordMessage', 'error', 'Vui long nhap ma phieu muon va ma nhan vien');
        return;
    }
    
    if (recordBooks.length === 0) {
        showMessage('recordMessage', 'error', 'Danh sach tra khong duoc trong');
        return;
    }
    
    hideMessage('recordMessage');
    
    const danhSachTra = recordBooks.map(book => ({
        ma_sach: book.ma_sach,
        tinh_trang_tra: book.tinh_trang_tra,
        phi_xu_ly: book.phi_xu_ly
    }));
    
    try {
        const result = await apiRequest('/returns', {
            method: 'POST',
            body: JSON.stringify({
                ma_phieu_muon: parseInt(ticketId),
                ma_nhan_vien: parseInt(staffId),
                danh_sach_tra: danhSachTra
            })
        });
        
        if (resultTicketId) resultTicketId.textContent = result.ma_phieu_muon;
        if (resultReturnDate) resultReturnDate.textContent = formatDate(result.ngay_tra);
        if (resultTotalFine) resultTotalFine.textContent = formatMoney(result.tong_tien_phat);
        
        if (recordResult) recordResult.style.display = 'block';
        recordBooksSection.style.display = 'none';
        
        showMessage('recordMessage', 'success', 'Ghi nhan tra sach thanh cong');
        
        setTimeout(() => {
            const recordClearBtn = document.getElementById('recordClearBtn');
            if (recordClearBtn) recordClearBtn.click();
        }, 2000);
    } catch (error) {
        console.error('Error in recordSubmit:', error);
        showMessage('recordMessage', 'error', 'Loi: ' + error.message);
    }
}

// ============================================================
// LIST RETURNS FUNCTIONS
// ============================================================

let currentListPage = 1;
let currentCondition = '';
let currentMemberId = '';

async function loadReturnList(append = false) {
    const listReturnsTable = document.getElementById('listReturnsTable');
    const listMessage = document.getElementById('listMessage');
    const listLoadMoreBtn = document.getElementById('listLoadMoreBtn');
    
    if (!listReturnsTable) {
        console.error('listReturnsTable element not found');
        return;
    }
    
    if (!append) {
        listReturnsTable.innerHTML = '<tr><td colspan="7" class="loading">Đang tải dữ liệu...</td></tr>';
    }
    
    let url = '/returns?page=' + currentListPage + '&per_page=20';
    
    if (currentCondition) {
        url += '&condition=' + encodeURIComponent(currentCondition);
    }
    
    if (currentMemberId) {
        url += '&member_id=' + encodeURIComponent(currentMemberId);
    }
    
    try {
        const result = await apiRequest(url);
        
        const return_records = result.return_records || [];
        
        let html = '';
        if (return_records.length === 0) {
            html = '<tr><td colspan="7" class="empty-state">Khong co du lieu</td></tr>';
        } else {
            return_records.forEach(record => {
                html += '<tr>' +
                    '<td><strong>' + escapeHtml(record.ma_phieu_muon) + '</strong></td>' +
                    '<td>' + escapeHtml(record.ten_doc_gia) + '</td>' +
                    '<td>' + escapeHtml(record.ten_sach) + '</td>' +
                    '<td>' + formatDate(record.han_tra) + '</td>' +
                    '<td>' + formatDate(record.ngay_tra) + '</td>' +
                    '<td>' + getConditionBadge(record.tinh_trang_tra) + '</td>' +
                    '<td><strong>' + formatMoney(record.tien_phat) + '</strong></td>' +
                    '</tr>';
            });
        }
        
        if (append) {
            listReturnsTable.innerHTML += html;
        } else {
            listReturnsTable.innerHTML = html;
        }
        
        const total_pages = result.total_pages || 0;
        const hasMore = currentListPage < total_pages;
        if (listLoadMoreBtn) {
            listLoadMoreBtn.style.display = hasMore ? 'block' : 'none';
        }
        
        if (listMessage) {
            hideMessage('listMessage');
        }
    } catch (error) {
        console.error('Error in loadReturnList:', error);
        listReturnsTable.innerHTML = '<tr><td colspan="7" class="empty-state">Loi: ' + escapeHtml(error.message) + '</td></tr>';
        if (listMessage) {
            showMessage('listMessage', 'error', 'Loi: ' + error.message);
        }
        if (listLoadMoreBtn) {
            listLoadMoreBtn.style.display = 'none';
        }
    }
}

// ============================================================
// STATS FUNCTIONS
// ============================================================

async function loadStats() {
    const statsMessage = document.getElementById('statsMessage');
    const statsBinhThuong = document.getElementById('statsBinhThuong');
    const statsHongNhe = document.getElementById('statsHongNhe');
    const statsHongNang = document.getElementById('statsHongNang');
    const statsMatSach = document.getElementById('statsMatSach');
    const statsTongTienPhat = document.getElementById('statsTongTienPhat');
    
    try {
        if (!statsBinhThuong || !statsHongNhe || !statsHongNang || !statsMatSach || !statsTongTienPhat) {
            console.error('Some stats DOM elements not found');
            return;
        }
        
        const result = await apiRequest('/returns/stats');
        
        const stats = result || {
            binh_thuong: 0,
            hong_nhe: 0,
            hong_nang: 0,
            mat_sach: 0,
            tong_tien_phat: 0
        };
        
        statsBinhThuong.textContent = stats.binh_thuong || 0;
        statsHongNhe.textContent = stats.hong_nhe || 0;
        statsHongNang.textContent = stats.hong_nang || 0;
        statsMatSach.textContent = stats.mat_sach || 0;
        statsTongTienPhat.textContent = formatMoney(stats.tong_tien_phat || 0);
        
        if (statsMessage) {
            hideMessage('statsMessage');
        }
    } catch (error) {
        console.error('Error in loadStats:', error);
        if (statsBinhThuong) statsBinhThuong.textContent = '0';
        if (statsHongNhe) statsHongNhe.textContent = '0';
        if (statsHongNang) statsHongNang.textContent = '0';
        if (statsMatSach) statsMatSach.textContent = '0';
        if (statsTongTienPhat) statsTongTienPhat.textContent = formatMoney(0);
        
        if (statsMessage) {
            showMessage('statsMessage', 'error', 'Loi: ' + error.message);
        }
    }
}

// ============================================================
// EVENT LISTENERS (NOW FUNCTIONS ARE DEFINED)
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - Setting up event listeners');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabContent = document.getElementById(tabName);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            if (tabName === 'list') {
                currentListPage = 1;
                loadReturnList();
            } else if (tabName === 'stats') {
                loadStats();
            }
        });
    });
    
    const lookupBtn = document.getElementById('lookupBtn');
    if (lookupBtn) {
        lookupBtn.addEventListener('click', performLookup);
    }
    
    const recordLoadBtn = document.getElementById('recordLoadBtn');
    if (recordLoadBtn) {
        recordLoadBtn.addEventListener('click', performRecordLoad);
    }
    
    const recordSubmitBtn = document.getElementById('recordSubmitBtn');
    if (recordSubmitBtn) {
        recordSubmitBtn.addEventListener('click', performRecordSubmit);
    }
    
    const recordClearBtn = document.getElementById('recordClearBtn');
    if (recordClearBtn) {
        recordClearBtn.addEventListener('click', () => {
            const recordTicketIdInput = document.getElementById('recordTicketId');
            const recordStaffIdInput = document.getElementById('recordStaffId');
            const recordBooksSection = document.getElementById('recordBooksSection');
            const recordResult = document.getElementById('recordResult');
            
            if (recordTicketIdInput) recordTicketIdInput.value = '';
            if (recordStaffIdInput) recordStaffIdInput.value = '';
            recordBooks = [];
            recordBooksSection.style.display = 'none';
            if (recordResult) recordResult.style.display = 'none';
            hideMessage('recordMessage');
        });
    }
    
    const listFilterBtn = document.getElementById('listFilterBtn');
    if (listFilterBtn) {
        listFilterBtn.addEventListener('click', () => {
            const listConditionFilter = document.getElementById('listConditionFilter');
            const listMemberIdFilter = document.getElementById('listMemberIdFilter');
            
            currentCondition = listConditionFilter.value;
            currentMemberId = listMemberIdFilter.value.trim();
            currentListPage = 1;
            loadReturnList();
        });
    }
    
    const listResetBtn = document.getElementById('listResetBtn');
    if (listResetBtn) {
        listResetBtn.addEventListener('click', () => {
            const listConditionFilter = document.getElementById('listConditionFilter');
            const listMemberIdFilter = document.getElementById('listMemberIdFilter');
            
            listConditionFilter.value = '';
            listMemberIdFilter.value = '';
            currentCondition = '';
            currentMemberId = '';
            currentListPage = 1;
            loadReturnList();
        });
    }
    
    const listLoadMoreBtn = document.getElementById('listLoadMoreBtn');
    if (listLoadMoreBtn) {
        listLoadMoreBtn.addEventListener('click', () => {
            currentListPage++;
            loadReturnList(true);
        });
    }
    
    // Auto-load list and stats tabs
    console.log('Auto-loading list and stats...');
    loadReturnList();
    loadStats();
});
