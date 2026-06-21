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
    return String(text)
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
    
    if (condition === 'Bình thường') {
        badgeClass = 'badge-normal';
        conditionText = 'Bình thường';
    } else if (condition === 'Hỏng nhẹ') {
        badgeClass = 'badge-light';
        conditionText = 'Hỏng nhẹ';
    } else if (condition === 'Hỏng nặng') {
        badgeClass = 'badge-heavy';
        conditionText = 'Hỏng nặng';
    } else if (condition === 'Mất') {
        badgeClass = 'badge-lost';
        conditionText = 'Mất sách';
    }
    
    return '<span class="badge ' + badgeClass + '">' + conditionText + '</span>';
}

// ============================================================
// USER CONTEXT HELPERS
// ============================================================

function getReturnUserContext() {
    const authRole = localStorage.getItem('authRole') || localStorage.getItem('userRole') || '';
    const normalizedRole = authRole.toLowerCase();
    const authUserRaw = localStorage.getItem('authUser');
    let authUser = null;

    try {
        authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
    } catch (error) {
        authUser = null;
    }

    const employeeRoles = ['employee', 'staff', 'admin', 'manager', 'quanly', 'quan_ly', 'quản lý', 'nhanvien'];
    const isEmployee = employeeRoles.includes(normalizedRole) || Boolean(authUser && authUser.MaNhanVien);

    const memberId = authUser
        ? authUser.MaDocGia || authUser.ma_doc_gia || authUser.maDocGia || ''
        : '';

    const staffId = authUser
        ? authUser.MaNhanVien || authUser.ma_nhan_vien || authUser.maNhanVien || ''
        : '';

    return {
        isEmployee,
        memberId,
        staffId
    };
}

// ------------------------------------------------------------
// Outstanding tickets (not yet returned)
// ------------------------------------------------------------
async function loadOutstandingTickets() {
    const tbl = document.getElementById('outstandingTicketsTable');
    if (!tbl) return;

    tbl.innerHTML = '<tr><td colspan="6" class="loading">Đang tải danh sách...</td></tr>';
    hideMessage('lookupMessage');

    try {
        const context = getReturnUserContext();
        const title = document.getElementById('outstandingTicketsTitle');
        const params = new URLSearchParams({
            status: 'DangMuon',
            page: '1',
            per_page: '50'
        });

        if (context.isEmployee) {
            if (title) title.textContent = 'Tất cả phiếu đang mượn chưa trả';
        } else {
            if (!context.memberId) {
                tbl.innerHTML = '<tr><td colspan="6" class="empty-state">Không xác định được độc giả đang đăng nhập.</td></tr>';
                showMessage('lookupMessage', 'error', 'Vui lòng đăng nhập bằng tài khoản độc giả để xem phiếu chưa trả.');
                return;
            }

            params.append('member_id', context.memberId);
            if (title) title.textContent = 'Phiếu đang mượn chưa trả của bạn';
        }

        const result = await apiRequest('/borrowing?' + params.toString());
        const records = (result && Array.isArray(result.borrowing_records)) ? result.borrowing_records : [];

        if (records.length === 0) {
            tbl.innerHTML = '<tr><td colspan="6" class="empty-state">Không có phiếu đang mượn</td></tr>';
            return;
        }

        tbl.innerHTML = records.map(r => `
            <tr>
                <td><strong>${r.ma_phieu_muon}</strong></td>
                <td>${escapeHtml(r.ten_doc_gia)}</td>
                <td>${escapeHtml(r.email || '')}</td>
                <td>${r.tong_so_cuon}</td>
                <td>${formatDate(r.ngay_muon || r.ngay_tao_phieu)}</td>
                <td>
                    ${context.isEmployee
                        ? `<button class="btn btn-primary btn-sm" data-id="${r.ma_phieu_muon}">Ghi nhận trả</button>`
                        : '<span class="badge badge-normal">Đang mượn</span>'}
                </td>
            </tr>
        `).join('');

        tbl.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const recordTicketInput = document.getElementById('recordTicketId');
                const recordStaffInput = document.getElementById('recordStaffId');

                if (recordTicketInput) recordTicketInput.value = id;
                if (recordStaffInput && context.staffId) recordStaffInput.value = context.staffId;

                const recordTab = document.querySelector('.tab-btn[data-tab="record"]');
                if (recordTab) recordTab.click();
                performRecordLoad();
            });
        });

    } catch (err) {
        console.error('Error loading outstanding tickets:', err);
        tbl.innerHTML = '<tr><td colspan="6" class="empty-state">Lỗi tải dữ liệu</td></tr>';
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
        showMessage('recordMessage', 'error', 'Vui lòng nhập mã phiếu mượn!');
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
            tinh_trang_tra: 'Bình thường',
            phi_xu_ly: 0,
            gia_bia: parseFloat(book.gia_bia) || 0,
            he_so_den_bu: parseFloat(book.he_so_den_bu) || 0
        }));
        
        if (recordMemberName) recordMemberName.textContent = escapeHtml(phieu.ten_doc_gia);
        if (recordBookCount) recordBookCount.textContent = books.length;
        
        renderRecordBooks();
        recordBooksSection.style.display = 'block';
        const recordResult = document.getElementById('recordResult');
        if (recordResult) recordResult.style.display = 'none';
        
        showMessage('recordMessage', 'success', 'Tải danh sách thành công!');
    } catch (error) {
        console.error('Error in recordLoad:', error);
        showMessage('recordMessage', 'error', 'Lỗi: ' + error.message);
        recordBooksSection.style.display = 'none';
    }
}

function renderRecordBooks() {
    const recordBooksContainer = document.getElementById('recordBooksContainer');
    let html = '';
    recordBooks.forEach((book, index) => {
        const isNoFee = (book.tinh_trang_tra === 'Bình thường' || book.tinh_trang_tra === 'Hỏng nhẹ');
        const baseCompensation = (book.gia_bia || 0) * (book.he_so_den_bu || 0);
        const totalProcessing = isNoFee ? 0 : (baseCompensation + (parseFloat(book.phi_xu_ly) || 0));

        html += '<div class="book-item">' +
            '<div>' +
            '<div class="book-item-label">Tên sách</div>' +
            '<input type="text" value="' + escapeHtml(book.ten_sach) + '" readonly>' +
            '</div>' +
            '<div>' +
            '<div class="book-item-label">Tình trạng</div>' +
            '<select onchange="updateRecordBook(' + index + ', \'tinh_trang_tra\', this.value)">' +
            '<option value="Bình thường" ' + (book.tinh_trang_tra === 'Bình thường' ? 'selected' : '') + '>Bình thường</option>' +
            '<option value="Hỏng nhẹ" ' + (book.tinh_trang_tra === 'Hỏng nhẹ' ? 'selected' : '') + '>Hỏng nhẹ</option>' +
            '<option value="Hỏng nặng" ' + (book.tinh_trang_tra === 'Hỏng nặng' ? 'selected' : '') + '>Hỏng nặng</option>' +
            '<option value="Mất" ' + (book.tinh_trang_tra === 'Mất' ? 'selected' : '') + '>Mất sách</option>' +
            '</select>' +
            '</div>' +
            '<input type="hidden" class="book-phi-xu-ly" value="' + (parseFloat(book.phi_xu_ly) || 0) + '">' +
            '<div>' +
            '<div class="book-item-label">Tổng phí xử lý (VND)</div>' +
            '<input type="text" value="' + escapeHtml(formatMoney(totalProcessing)) + '" readonly>' +
            '</div>' +
            '<button class="btn btn-danger btn-sm" type="button" onclick="removeRecordBook(' + index + ')">Xóa</button>' +
            '</div>';
    });
    if (recordBooksContainer) {
        recordBooksContainer.innerHTML = html;
    }
}

function updateRecordBook(index, field, value) {
    if (field === 'tinh_trang_tra') {
        recordBooks[index].tinh_trang_tra = value;
        // If status is Bình thường or Hỏng nhẹ then force operational fee to 0
        if (value === 'Bình thường' || value === 'Hỏng nhẹ') {
            recordBooks[index].phi_xu_ly = 0;
        }
    } else if (field === 'phi_xu_ly') {
        // allow decimals
        let v = parseFloat(value);
        if (isNaN(v) || v < 0) v = 0;
        recordBooks[index].phi_xu_ly = v;
    }
    // Re-render to update computed totals and disabled states
    renderRecordBooks();
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
        tinh_trang_tra: (function(display){
            switch(display) {
                case 'Bình thường': return 'BinhThuong';
                case 'Hỏng nhẹ': return 'HongNhe';
                case 'Hỏng nặng': return 'HongNang';
                case 'Mất': return 'Mat';
                default: return display;
            }
        })(book.tinh_trang_tra),
        phi_xu_ly: parseFloat(book.phi_xu_ly) || 0
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
        showMessage('recordMessage', 'error', 'Lỗi: ' + error.message);
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
            html = '<tr><td colspan="7" class="empty-state">Không có dữ liệu</td></tr>';
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
        listReturnsTable.innerHTML = '<tr><td colspan="7" class="empty-state">Lỗi: ' + escapeHtml(error.message) + '</td></tr>';
        if (listMessage) {
            showMessage('listMessage', 'error', 'Lỗi: ' + error.message);
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
    const membersStatsSection = document.getElementById('membersStatsSection');
    const membersStatsBody = document.getElementById('membersStatsBody');
    
    try {
        if (!statsBinhThuong || !statsHongNhe || !statsHongNang || !statsMatSach || !statsTongTienPhat) {
            console.error('Some stats DOM elements not found');
            return;
        }
        const ctx = getReturnUserContext();

        if (!ctx.isEmployee) {
            // Member view: only their stats
            if (!ctx.memberId) {
                if (statsMessage) showMessage('statsMessage', 'error', 'Vui lòng đăng nhập bằng tài khoản độc giả để xem thống kê.');
                return;
            }

            const result = await apiRequest('/returns/stats?member_id=' + encodeURIComponent(ctx.memberId));
            const stats = result || { binh_thuong: 0, hong_nhe: 0, hong_nang: 0, mat_sach: 0, tong_tien_phat: 0 };

            statsBinhThuong.textContent = stats.binh_thuong || 0;
            statsHongNhe.textContent = stats.hong_nhe || 0;
            statsHongNang.textContent = stats.hong_nang || 0;
            statsMatSach.textContent = stats.mat_sach || 0;
            statsTongTienPhat.textContent = formatMoney(stats.tong_tien_phat || 0);

            // hide members section for members
            if (membersStatsSection) membersStatsSection.style.display = 'none';
            if (statsMessage) hideMessage('statsMessage');
            return;
        }

        // Employee view: show global stats + per-member table
        const [globalStats, membersResp] = await Promise.all([
            apiRequest('/returns/stats'),
            apiRequest('/returns/members')
        ]);

        const stats = globalStats || { binh_thuong: 0, hong_nhe: 0, hong_nang: 0, mat_sach: 0, tong_tien_phat: 0 };

        statsBinhThuong.textContent = stats.binh_thuong || 0;
        statsHongNhe.textContent = stats.hong_nhe || 0;
        statsHongNang.textContent = stats.hong_nang || 0;
        statsMatSach.textContent = stats.mat_sach || 0;
        statsTongTienPhat.textContent = formatMoney(stats.tong_tien_phat || 0);

        // Render members table
        const members = (membersResp && membersResp.members) ? membersResp.members : [];
        if (membersStatsBody) {
            if (!Array.isArray(members) || members.length === 0) {
                membersStatsBody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có dữ liệu</td></tr>';
            } else {
                membersStatsBody.innerHTML = members.map(m => `
                    <tr>
                        <td>${escapeHtml(m.MaDocGia)}</td>
                        <td>${escapeHtml(m.HoTen || '')}</td>
                        <td>${m.binh_thuong || 0}</td>
                        <td>${m.hong_nhe || 0}</td>
                        <td>${m.hong_nang || 0}</td>
                        <td>${m.mat_sach || 0}</td>
                        <td><strong>${formatMoney(m.tong_tien_phat || 0)}</strong></td>
                    </tr>
                `).join('');
            }
        }

        if (membersStatsSection) membersStatsSection.style.display = 'block';
        if (statsMessage) hideMessage('statsMessage');
    } catch (error) {
        console.error('Error in loadStats:', error);
        if (statsBinhThuong) statsBinhThuong.textContent = '0';
        if (statsHongNhe) statsHongNhe.textContent = '0';
        if (statsHongNang) statsHongNang.textContent = '0';
        if (statsMatSach) statsMatSach.textContent = '0';
        if (statsTongTienPhat) statsTongTienPhat.textContent = formatMoney(0);
        
        if (statsMessage) {
            showMessage('statsMessage', 'error', 'Lỗi: ' + error.message);
        }
    }
}

// ============================================================
// EVENT LISTENERS (NOW FUNCTIONS ARE DEFINED)
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - Setting up event listeners');
    
    // Hide 'Ghi nhận trả' tab for non-employees
    const returnContext = getReturnUserContext();
    const recordTabBtn = document.querySelector('.tab-btn[data-tab="record"]');
    const recordTabContent = document.getElementById('record');
    if (recordTabBtn && !returnContext.isEmployee) {
        recordTabBtn.remove();
    }
    if (recordTabContent && !returnContext.isEmployee) {
        recordTabContent.remove();
    }

        // If user is a member (not employee), restrict the list view to that member only
        const listMemberIdFilter = document.getElementById('listMemberIdFilter');
        if (!returnContext.isEmployee) {
            if (returnContext.memberId) {
                // enforce filter so member only sees their own returned records
                currentMemberId = returnContext.memberId;
                if (listMemberIdFilter) {
                    listMemberIdFilter.value = returnContext.memberId;
                    listMemberIdFilter.readOnly = true;
                    listMemberIdFilter.style.display = 'none';
                }
            } else {
                // no member context available
                showMessage('listMessage', 'error', 'Vui lòng đăng nhập bằng tài khoản độc giả để xem danh sách trả.');
            }
        }

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
    
    const outstandingRefreshBtn = document.getElementById('outstandingRefreshBtn');
    if (outstandingRefreshBtn) {
        outstandingRefreshBtn.addEventListener('click', loadOutstandingTickets);
    }

    const recordStaffIdInput = document.getElementById('recordStaffId');
    if (recordStaffIdInput && returnContext.isEmployee && returnContext.staffId) {
        recordStaffIdInput.value = returnContext.staffId;
        recordStaffIdInput.readOnly = true;
    }

    // Auto-load outstanding tickets for the current role.
    loadOutstandingTickets();
    
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
            // If employee, allow custom member filter. If a member, enforce their own id.
            if (returnContext.isEmployee) {
                currentMemberId = listMemberIdFilter.value.trim();
            } else {
                currentMemberId = returnContext.memberId || '';
            }
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
            // Keep member filter for logged-in members
            if (returnContext.isEmployee) {
                if (listMemberIdFilter) listMemberIdFilter.value = '';
                currentMemberId = '';
            } else {
                if (listMemberIdFilter) listMemberIdFilter.value = returnContext.memberId || '';
                currentMemberId = returnContext.memberId || '';
            }
            currentCondition = '';
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
