// Tự động kéo thông báo về khi mở trang
document.addEventListener('DOMContentLoaded', fetchNotifications);

async function fetchNotifications() {
    const listDiv = document.getElementById('notification-list');
    
    // 1. Lấy dữ liệu user từ LocalStorage
    const authUserString = localStorage.getItem('authUser');
    let maDocGia = '';
    
    // Kiểm tra xem có user không
    if (authUserString) {
        try {
            const user = JSON.parse(authUserString);
            // Gán mã độc giả (Điều chỉnh tên biến 'MaDocGia' nếu trong object của bạn nó tên là 'id' hoặc 'ma_dg')
            maDocGia = user.MaDocGia || user.id || '';
        } catch (e) {
            console.error("Lỗi parse authUser:", e);
        }
    }

    // 2. Nếu không có MaDocGia, hiển thị luôn thông báo không có dữ liệu để không gọi API thừa
    if (!maDocGia) {
        listDiv.innerHTML = '<div style="text-align:center; color:#718096; padding: 20px;">Không có thông báo nào dành cho bạn.</div>';
        return;
    }

    try {
        // 3. Gọi API kèm mã độc giả để Backend lọc
        const url = `/api/notifications?ma_doc_gia=${maDocGia}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            listDiv.innerHTML = '';
            
            // Nếu không có thông báo
            if (result.data.length === 0) {
                listDiv.innerHTML = '<div style="text-align:center; color:#718096; padding: 20px;">Hệ thống hiện không có thông báo nào.</div>';
                return;
            }

            // 4. Đổ dữ liệu ra màn hình
            result.data.forEach(noti => {
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
        } else {
            throw new Error(result.message || "Lỗi dữ liệu");
        }
    } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
        listDiv.innerHTML = '<div style="text-align:center; color:#e53e3e;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại!</div>';
    }
}