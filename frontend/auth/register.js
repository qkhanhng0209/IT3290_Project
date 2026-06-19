document.getElementById('reg-email').addEventListener('blur', function() {
    const email = this.value.trim();
    const errorSpan = document.getElementById('email-error');

    if (email === "") {
        errorSpan.innerText = "Email không được để trống!";
    } else if (!email.endsWith('@gmail.com')) {
        errorSpan.innerText = "Email phải có đuôi @gmail.com bạn ơi!";
    } else {
        errorSpan.innerText = "";
    }
});

document.getElementById('reg-phone').addEventListener('blur', function() {
    const phone = this.value.trim();
    const errorSpan = document.getElementById('phone-error');

    if (phone === "") {
        errorSpan.innerText = "Số điện thoại không được để trống!";
    } else if (phone.length !== 10) {
        errorSpan.innerText = "Số điện thoại phải có đúng 10 chữ số!";
    } else {
        errorSpan.innerText = "";
    }
});

async function handleRegister(event) {
    event.preventDefault(); 

    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    
    // 1. Chặn lại nếu các trường nhập liệu đang có lỗi hiển thị
    if (document.getElementById('email-error').innerText !== "" || 
        document.getElementById('phone-error').innerText !== "") {
        alert("Vui lòng sửa các lỗi đỏ trên màn hình trước khi đăng ký!");
        return;
    }

    // 2. Gom dữ liệu để chuẩn bị gửi lên API Backend
    const registerData = {
        email: email,
        phone: phone
        // Thêm các trường khác nếu Form của bạn có (ví dụ: ho_ten, dia_chi...)
    };

    try {
        document.getElementById('assigned-id').innerText = "Đang cấp phát mã...";
        
        const response = await window.API.auth.registerReader(registerData);

        if (response.success || response.status === "success") {
            
            const readerId = response.data.ma_doc_gia; 

            document.getElementById('assigned-id').innerText = readerId;
            document.getElementById('register-success').classList.remove('hidden');

            alert(`Đăng ký thành công!\nMã độc giả cấp mới: ${readerId}`);
            
            
        } else {
            document.getElementById('assigned-id').innerText = "Lỗi!";
            alert("Đăng ký thất bại: " + response.message);
        }

    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        document.getElementById('assigned-id').innerText = "Lỗi!";
        alert("Không thể kết nối đến máy chủ Backend. Vui lòng thử lại sau!");
    }
}
