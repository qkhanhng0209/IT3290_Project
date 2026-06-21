// Load members when page is ready
document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem('userRole') || 'staff';
    const welcomeText = document.getElementById('welcome-role');
    const addBtn = document.getElementById('btn-add-member');

    if (role === 'staff') {
        welcomeText.innerText = "Quyền hạn: Nhân viên (Chỉ xem/sửa)";
        if (addBtn) addBtn.style.display = 'none';
    } else if (role === 'admin') {
        welcomeText.innerText = "Quyền hạn: Quản lý (Toàn quyền CRUD)";
        welcomeText.style.color = "#e74c3c";
    }

    loadMembers();
    loadNhanvien();
});

// Load all members from API using shared API
async function loadMembers() {
    try {
        const members = await API.members.getMembers();
        renderMembers(members);
    } catch (err) {
        console.error('Không thể tải danh sách độc giả:', err);
        const tbody = document.getElementById('member-table-body');
        tbody.innerHTML = `<tr><td colspan="10">Lỗi khi tải dữ liệu độc giả: ${err.message}</td></tr>`;
    }
}

function renderMembers(list) {
    const tbody = document.getElementById('member-table-body');
    tbody.innerHTML = '';

    if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10">Chưa có độc giả nào.</td></tr>';
        return;
    }

    const role = localStorage.getItem('userRole') || 'staff';

    list.forEach(item => {
        const tr = document.createElement('tr');

        const tongNo = Number(item.TongNo || 0).toLocaleString('vi-VN', {minimumFractionDigits:2});

        tr.innerHTML = `
            <td><strong>${item.MaDocGia}</strong></td>
            <td>${escapeHtml(item.HoTen || '')}</td>
            <td>${escapeHtml(item.GioiTinh || '')}</td>
            <td>${escapeHtml(item.Email || '')}</td>
            <td>${escapeHtml(item.SoDienThoai || '')}</td>
            <td>${formatDate(item.NgayCapThe)}</td>
            <td>${formatDate(item.NgayHetHan)}</td>
            <td>${tongNo}đ</td>
            <td>${statusBadge(item.TrangThaiThe)}</td>
            <td>
                ${role === 'admin' ? `<button class="btn btn-edit" onclick="editMember(${item.MaDocGia})">Sửa</button>` : ''}
                ${role === 'admin' ? `<button class="btn btn-delete" onclick="deleteMember(${item.MaDocGia})">Xóa</button>` : ''}
                ${item.TrangThaiThe !== 'Hoat Dong' && role === 'admin' ? `<button class="btn btn-edit" onclick="activateMember(${item.MaDocGia})">Kích hoạt</button>` : ''}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function statusBadge(status) {
    if (!status) return '';
    const s = String(status).trim();
    if (s === 'Hoat Dong') return `<span class="status-badge status-active">Hoạt động</span>`;
    if (s === 'Bi khoa') return `<span class="status-badge status-locked">Khóa</span>`;
    if (s === 'HetHan') return `<span class="status-badge status-locked">Hết hạn</span>`;
    return `<span class="status-badge">${escapeHtml(s)}</span>`;
}

function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('vi-VN');
}

// Load all employees from API using shared API
async function loadNhanvien() {
    try {
        const nhanvienList = await API.nhanvien.getNhanvien();
        renderNhanvien(nhanvienList);
    } catch (err) {
        console.error('Không thể tải danh sách nhân viên:', err);
        const tbody = document.getElementById('nhanvien-table-body');
        tbody.innerHTML = `<tr><td colspan="4">Lỗi khi tải dữ liệu nhân viên: ${err.message}</td></tr>`;
    }
}

function renderNhanvien(list) {
    const tbody = document.getElementById('nhanvien-table-body');
    tbody.innerHTML = '';

    if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Chưa có nhân viên nào.</td></tr>';
        return;
    }

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.MaNhanVien}</strong></td>
            <td>${escapeHtml(item.HoTen || '')}</td>
            <td>${escapeHtml(item.Email || '')}</td>
            <td>${escapeHtml(item.ChucVu || '')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function addMemberClick() {
    alert("Tính năng thêm độc giả chưa được triển khai trên API.");
}

function editMember(id) {
    alert(`Tính năng sửa độc giả chưa được triển khai trên API. (id=${id})`);
}

async function deleteMember(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa độc giả ${id}?`)) return;
    try {
        await API.members.deleteMember(id);
        alert('Xóa thành công');
        loadMembers();
    } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
    }
}

async function activateMember(id) {
    try {
        await API.members.activateMember(id);
        alert('Kích hoạt thành công');
        loadMembers();
    } catch (err) {
        alert('Lỗi khi kích hoạt: ' + err.message);
    }
}
