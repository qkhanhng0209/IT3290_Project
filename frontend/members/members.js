document.addEventListener("DOMContentLoaded", function() {
    // Lấy quyền đã lưu ở file login.js khi đăng nhập
    const role = localStorage.getItem('userRole') || 'staff'; 
    const welcomeText = document.getElementById('welcome-role');

    if (role === 'staff') {
        welcomeText.innerText = "Quyền hạn: Nhân viên (Chỉ xem/sửa)";
        
        // 1. Ẩn nút "Thêm độc giả mới"
        if(document.getElementById('btn-add-member')) {
            document.getElementById('btn-add-member').style.display = 'none';
        }
        
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(btn => btn.style.display = 'none');
    } else if (role === 'admin') {
        welcomeText.innerText = "Quyền hạn: Quản lý (Toàn quyền CRUD)";
        welcomeText.style.color = "#e74c3c"; // Chữ màu đỏ cho nổi bật quyền Admin
    }
});

//  nút Thêm độc giả mới (POST /api/members)
function addMemberClick() {
    alert("Hệ thống sẽ mở Form thêm mới độc giả!\n(Kích hoạt API: POST /api/members)");
}

// Giả lập hành động khi bấm nút Sửa (GET /api/members/<id> và PUT /api/members/<id>)
function editMember(id) {
    alert(`Đang lấy thông tin chi tiết của độc giả: ${id} (GET /api/members/${id})\nHệ thống sẽ cho phép sửa đổi dữ liệu (PUT /api/members/${id})`);
}

function deleteMember(id) {
    const confirmDelete = confirm(`Bạn có chắc chắn muốn XÓA độc giả ${id} ra khỏi cơ sở dữ liệu không?`);
    if (confirmDelete) {
        alert(`Đã xóa thành công độc giả ${id}!\n(Kích hoạt API: DELETE /api/members/${id})`);
        // gọi lệnh xóa dòng trên giao diện HTML ở đây
    }
}
