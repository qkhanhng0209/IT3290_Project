let currentRole = 'reader';

function switchRole(role) {
    currentRole = role;

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (role === 'reader') {
        tabs[0].classList.add('active');
        document.getElementById('account-label').innerText = "Tài khoản độc giả";
        document.getElementById('login-account').placeholder = "Mã độc giả, Email hoặc SĐT";
        document.getElementById('register-link-box').style.display = "block"; // Hiện dòng chữ đăng ký
    } else {
        tabs[1].classList.add('active');
        document.getElementById('account-label').innerText = "Tài khoản nhân viên";
        document.getElementById('login-account').placeholder = "Mã nhân viên (Staff ID) hoặc Email nội bộ";
        document.getElementById('register-link-box').style.display = "none"; // Nhân viên không được tự đăng ký, ẩn đi
    }
}


function handleLogin(event) {
    event.preventDefault();
    
    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;

    if (password.length < 6) {
        alert("Mật khẩu phải từ 6 ký tự trở lên!");
        return; 
    }
    if (currentRole === 'reader') {

        if (account.includes('@')) {
            console.log("Độc giả đăng nhập bằng Email");
        } else if (account.startsWith('VN')) { 
            console.log("Độc giả đăng nhập bằng Mã độc giả");
        } else {
            console.log("Độc giả đăng nhập bằng Số điện thoại");
        }

        alert(`Độc giả đăng nhập thành công: ${account}`);
        window.location.href = 'trang_chu.html'; 

    } else {
        console.log("Nhân viên/Quản lý đang đăng nhập");

        alert(`Nhân viên đăng nhập thành công: ${account}`);
        window.location.href = 'IT3290_Project/frontend/index.html';
    }
}
