// Tự động tải dữ liệu khi trang vừa mở lên
document.addEventListener('DOMContentLoaded', fetchViolations);

async function fetchViolations() {
    const tbody = document.getElementById('violation-list');
    
    // 1. Lấy thông tin user từ LocalStorage
    const authUser = JSON.parse(localStorage.getItem('authUser'));
    const authRole = localStorage.getItem('authRole') || 'reader'; // Mặc định là reader
    const maDocGia = authUser ? (authUser.MaDocGia || authUser.id) : '';

    try {
        // 2. Gửi thêm role và ma_doc_gia lên Backend để phân quyền
        const url = `/api/violations?role=${authRole}&ma_doc_gia=${maDocGia}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            tbody.innerHTML = ''; 
            
            if(result.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Không có vi phạm nào.</td></tr>`;
                return;
            }

            // Đổ dữ liệu
            result.data.forEach(item => {
                const hanTra = item.HanTra ? new Date(item.HanTra).toLocaleDateString('vi-VN') : 'N/A';
                const tienPhat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.TienPhat);

                tbody.innerHTML += `
                    <tr>
                        <td><strong>${item.MaDocGia}</strong></td>
                        <td>${item.HoTen}</td>
                        <td>${item.MaSach}</td>
                        <td>${hanTra}</td>
                        <td class="text-danger">${tienPhat}</td>
                        <td>${item.TinhTrangTra || 'Trễ hạn'}</td>
                    </tr>
                `;
            });
        } else {
            // Hiển thị lỗi nếu Backend trả về 403 (Truy cập bị từ chối)
            tbody.innerHTML = `<tr><td colspan="6" class="empty-msg text-danger">${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="empty-msg text-danger">Lỗi kết nối máy chủ!</td></tr>`;
    }
}

// Hàm 2: Gọi API quét vi phạm tự động
async function triggerViolations() {
    if(!confirm("Hệ thống sẽ quét toàn bộ phiếu mượn, tính tiền phạt và khóa thẻ các độc giả nợ quá hạn. Bạn có chắc chắn?")) return;

    try {
        const response = await fetch('/api/violations', { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            alert("✅ Thành công: " + result.data.message);
            fetchViolations(); 
        } else {
            alert("❌ Lỗi hệ thống: " + result.message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert("Có lỗi xảy ra khi kết nối đến server!");
    }
}