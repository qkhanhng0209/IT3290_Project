// Tự động tải dữ liệu khi trang vừa mở lên
document.addEventListener('DOMContentLoaded', fetchViolations);

// Hàm 1: Lấy danh sách vi phạm từ Backend
async function fetchViolations() {
    const tbody = document.getElementById('violation-list');
    try {
        // Dùng đường dẫn tương đối (Relative path) giống hệt các file khác
        const response = await fetch('/api/violations');
        const result = await response.json();

        if (result.success) {
            tbody.innerHTML = ''; 
            
            if(result.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">Hệ thống hiện không có vi phạm nào.</td></tr>`;
                return;
            }

            // Lặp qua từng dòng dữ liệu để in ra bảng
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
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="empty-msg text-danger">Lỗi kết nối máy chủ! Vui lòng kiểm tra Backend.</td></tr>`;
    }
}

// Hàm 2: Gọi API quét vi phạm tự động
async function triggerViolations() {
    if(!confirm("Hệ thống sẽ quét toàn bộ phiếu mượn, tính tiền phạt và khóa thẻ các độc giả nợ quá hạn. Bạn có chắc chắn?")) return;

    try {
        // Gọi thẳng vào route '/api/violations' với method POST
        const response = await fetch('/api/violations', { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            alert("✅ Thành công: " + result.data.message);
            fetchViolations(); // Tải lại bảng
        } else {
            alert("❌ Lỗi hệ thống: " + result.message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert("Có lỗi xảy ra khi kết nối đến server!");
    }
}