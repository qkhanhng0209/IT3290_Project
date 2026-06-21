// Load members when page is ready
document.addEventListener("DOMContentLoaded", function() {
    const authRole = localStorage.getItem('authRole');
    if (!authRole) {
        document.body.innerHTML = '<div style="text-align:center;padding:40px;color:#666;font-size:18px;">Bạn phải đăng nhập mới xem được trang này.</div>';
        return;
    }

    const role = authRole;
    const welcomeText = document.getElementById('welcome-role');
    const addMemberBtn = document.getElementById('btn-add-member');
    const addNhanvienBtn = document.getElementById('btn-add-nhanvien');

    if (role === 'reader') {
        welcomeText.innerText = "Quyền hạn: Độc giả (Chỉ xem)";
        document.querySelector('.header-box').style.display = 'none';
        document.querySelectorAll('.table-container').forEach(function(el) { el.style.display = 'none'; });
        const bars = document.querySelectorAll('.action-bar');
        bars.forEach(function(el) { el.style.display = 'none'; });
        document.body.insertAdjacentHTML('afterbegin', '<div style="text-align:center;padding:40px;color:#666;font-size:18px;">Bạn không có quyền truy cập chức năng quản lý thành viên.</div>');
        return;
    } else if (role === 'manager') {
        welcomeText.innerText = "Quyền hạn: Quản lý (Toàn quyền CRUD)";
        welcomeText.style.color = "#e74c3c";
    } else if (role === 'employee') {
        welcomeText.innerText = "Quyền hạn: Nhân viên (Chỉ xem/sửa)";
        if (addMemberBtn) addMemberBtn.style.display = 'none';
        if (addNhanvienBtn) addNhanvienBtn.style.display = 'none';
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

    const role = localStorage.getItem('authRole') || 'reader';

    list.forEach(item => {
        const tr = document.createElement('tr');

        const tongNo = Number(item.TongNo || 0).toLocaleString('vi-VN', {minimumFractionDigits:2});

        const canManage = role === 'manager' || role === 'employee';

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
                ${canManage ? `<button class="btn btn-edit" onclick="editMember(${item.MaDocGia})">Sửa</button>` : ''}
                ${role === 'manager' ? `<button class="btn btn-delete" onclick="deleteMember(${item.MaDocGia})">Xóa</button>` : ''}
                ${item.TrangThaiThe !== 'Hoat Dong' && role === 'manager' ? `<button class="btn btn-edit" onclick="activateMember(${item.MaDocGia})">Kích hoạt</button>` : ''}
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

    const role = localStorage.getItem('authRole') || 'reader';

    list.forEach(item => {
        const tr = document.createElement('tr');
        const canManage = role === 'manager' || role === 'employee';
        tr.innerHTML = `
            <td><strong>${item.MaNhanVien}</strong></td>
            <td>${escapeHtml(item.HoTen || '')}</td>
            <td>${escapeHtml(item.Email || '')}</td>
            <td>${escapeHtml(item.ChucVu || '')}</td>
            <td>
                ${canManage ? `<button class="btn btn-edit" onclick="editNhanvien(${item.MaNhanVien})">Sửa</button>` : ''}
                ${role === 'manager' ? `<button class="btn btn-delete" onclick="deleteNhanvien(${item.MaNhanVien})">Xóa</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

// ---------- Member CRUD ----------
function addMemberClick() {
    const form = document.getElementById('member-form');
    form.reset();
    document.getElementById('modal-title').innerText = 'Thêm Độc Giả Mới';
    document.getElementById('modal-ma').innerText = '(Tự động tạo)';
    document.getElementById('modal-ma').parentElement.style.display = 'none';
    document.getElementById('btn-save-member').style.display = 'inline-block';
    document.getElementById('btn-save-member').dataset.mode = 'add';
    document.getElementById('member-modal').classList.add('active');
}

function editMember(id) {
    API.members.getMemberById(id).then(member => {
        if (!member) return alert('Không tìm thấy độc giả!');
        document.getElementById('modal-title').innerText = 'Sửa Độc Giả';
        document.getElementById('modal-ma').innerText = member.MaDocGia;
        document.getElementById('modal-ma').parentElement.style.display = 'block';
        document.getElementById('modal-ho-ten').value = member.HoTen || '';
        document.getElementById('modal-gioi-tinh').value = member.GioiTinh || '';
        document.getElementById('modal-email').value = member.Email || '';
        document.getElementById('modal-sdt').value = member.SoDienThoai || '';
        document.getElementById('modal-ngay-cap-the').value = member.NgayCapThe || '';
        document.getElementById('modal-ngay-het-han').value = member.NgayHetHan || '';
        document.getElementById('modal-tong-no').value = member.TongNo || 0;
        document.getElementById('modal-trang-thai').value = member.TrangThaiThe || 'Hoat Dong';
        document.getElementById('btn-save-member').style.display = 'inline-block';
        document.getElementById('btn-save-member').dataset.mode = 'edit';
        document.getElementById('btn-save-member').dataset.id = id;
        document.getElementById('member-modal').classList.add('active');
    }).catch(err => {
        alert('Lỗi khi tải thông tin độc giả: ' + err.message);
    });
}

async function saveMember() {
    const mode = document.getElementById('btn-save-member').dataset.mode;
    const payload = {
        hoTen: document.getElementById('modal-ho-ten').value.trim(),
        gioiTinh: document.getElementById('modal-gioi-tinh').value.trim(),
        email: document.getElementById('modal-email').value.trim(),
        soDienThoai: document.getElementById('modal-sdt').value.trim(),
        ngayCapThe: document.getElementById('modal-ngay-cap-the').value || null,
        ngayHetHan: document.getElementById('modal-ngay-het-han').value || null,
        trangThaiThe: document.getElementById('modal-trang-thai').value
    };

    if (!payload.hoTen) {
        alert('Vui lòng nhập họ và tên!');
        return;
    }

    try {
        if (mode === 'add') {
            const res = await API.members.addMember(payload);
            alert('Thêm độc giả thành công! Mã: ' + res.maDocGia);
        } else {
            const id = document.getElementById('btn-save-member').dataset.id;
            await API.members.updateMember(id, payload);
            alert('Cập nhật độc giả thành công!');
        }
        closeMemberModal();
        loadMembers();
    } catch (err) {
        alert('Lỗi khi lưu: ' + err.message);
    }
}

function closeMemberModal() {
    document.getElementById('member-modal').classList.remove('active');
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

// ---------- NhanVien CRUD ----------
function addNhanvienClick() {
    const form = document.getElementById('nhanvien-form');
    form.reset();
    document.getElementById('nhanvien-modal-title').innerText = 'Thêm Nhân Viên Mới';
    document.getElementById('modal-nhanvien-ma').innerText = '(Tự động tạo)';
    document.getElementById('modal-nhanvien-ma').parentElement.style.display = 'none';
    document.getElementById('btn-save-nhanvien').style.display = 'inline-block';
    document.getElementById('btn-save-nhanvien').dataset.mode = 'add';
    document.getElementById('nhanvien-modal').classList.add('active');
}

function editNhanvien(id) {
    API.nhanvien.getNhanvienById(id).then(nv => {
        if (!nv) return alert('Không tìm thấy nhân viên!');
        document.getElementById('nhanvien-modal-title').innerText = 'Sửa Nhân Viên';
        document.getElementById('modal-nhanvien-ma').innerText = nv.MaNhanVien;
        document.getElementById('modal-nhanvien-ma').parentElement.style.display = 'block';
        document.getElementById('modal-nhanvien-ho-ten').value = nv.HoTen || '';
        document.getElementById('modal-nhanvien-email').value = nv.Email || '';
        document.getElementById('modal-nhanvien-chuc-vu').value = nv.ChucVu || 'NhanVien';
        document.getElementById('btn-save-nhanvien').style.display = 'inline-block';
        document.getElementById('btn-save-nhanvien').dataset.mode = 'edit';
        document.getElementById('btn-save-nhanvien').dataset.id = id;
        document.getElementById('nhanvien-modal').classList.add('active');
    }).catch(err => {
        alert('Lỗi khi tải thông tin nhân viên: ' + err.message);
    });
}

async function saveNhanvien() {
    const mode = document.getElementById('btn-save-nhanvien').dataset.mode;
    const payload = {
        hoTen: document.getElementById('modal-nhanvien-ho-ten').value.trim(),
        email: document.getElementById('modal-nhanvien-email').value.trim(),
        chucVu: document.getElementById('modal-nhanvien-chuc-vu').value,
        matKhau: '123456'
    };

    if (!payload.hoTen || !payload.email) {
        alert('Vui lòng nhập họ tên và email!');
        return;
    }

    try {
        if (mode === 'add') {
            const res = await API.nhanvien.addNhanvien(payload);
            alert('Thêm nhân viên thành công! Mã: ' + res.maNhanVien);
        } else {
            const id = document.getElementById('btn-save-nhanvien').dataset.id;
            await API.nhanvien.updateNhanvien(id, payload);
            alert('Cập nhật nhân viên thành công!');
        }
        closeNhanvienModal();
        loadNhanvien();
    } catch (err) {
        alert('Lỗi khi lưu nhân viên: ' + err.message);
    }
}

function closeNhanvienModal() {
    document.getElementById('nhanvien-modal').classList.remove('active');
}

async function deleteNhanvien(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${id}?`)) return;
    try {
        await API.apiRequest(`/nhanvien/${id}`, { method: 'DELETE' });
        alert('Xóa thành công');
        loadNhanvien();
    } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
    }
}
