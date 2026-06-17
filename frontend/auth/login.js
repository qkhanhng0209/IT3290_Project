function handleLogin(event) {
    event.preventDefault();
    
    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;

    if (password.length < 6) {
        alert("Mật khẩu phải từ 6 ký tự trở lên!");
        return; 
    }

    if (account.includes('@')) {
        console.log("Người dùng đang đăng nhập bằng Email");
    } else if (account.startsWith('VN')) { 
        console.log("Người dùng đang đăng nhập bằng Mã độc giả");
    } else {
        console.log("Người dùng đang đăng nhập bằng Số điện thoại");
    }

    alert(`Đăng nhập thành công với tài khoản: ${account}`);
    window.location.href = 'IT3290/frontend/index.html'; 
}
