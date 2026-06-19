// Tự động kéo thông báo về khi mở trang
document.addEventListener('DOMContentLoaded', fetchNotifications);

async function fetchNotifications() {
    const listDiv = document.getElementById('notification-list');
    try {
        // Gọi thẳng đường dẫn tương đối
        const response = await fetch('/api/notifications');
        const result = await response.json();

        if (result.success) {
            listDiv.innerHTML = '';
            
            // Nếu không có thông báo nào
            if (result.data.length === 0) {
                listDiv.innerHTML = '<div style="text-align:center; color:#718096; padding: 20px;">Hệ thống hiện không có thông báo nào.</div>';
                return;
            }

            // Đổ dữ liệu ra màn hình
            result.data.forEach(noti => {
                // Xác định viền màu dựa trên loại thông báo
                const cssClass = noti.LoaiThongBao === 'KhoaThe' ? 'noti-KhoaThe' : 'noti-NhacTraSach';
                
                // Format ngày giờ Việt Nam
                const dateStr = new Date(noti.NgayGui).toLocaleString('vi-VN', {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                });
                
                listDiv.innerHTML += `
                    <div class="noti-box ${cssClass}">
                        <h4 class="noti-title">
                            ${noti.TieuDe}
                            <span class="noti-date">${dateStr}</span>
                        </h4>
                        <p class="noti-content">
                            <strong>[Mã ĐG: ${noti.MaDocGia}]</strong> - ${noti.NoiDung}
                        </p>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
        listDiv.innerHTML = '<div style="text-align:center; color:#e53e3e;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại Backend!</div>';
    }
}