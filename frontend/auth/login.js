let currentRole = 'reader';

function switchRole(role) {
    currentRole = role;

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (role === 'reader') {
        tabs[0].classList.add('active');
        document.getElementById('account-label').innerText = "Tai khoan doc gia";
        document.getElementById('login-account').placeholder = "Ma doc gia, Email hoac SDT";
        document.getElementById('register-link-box').style.display = "block";
    } else {
        tabs[1].classList.add('active');
        document.getElementById('account-label').innerText = "Tai khoan nhan vien";
        document.getElementById('login-account').placeholder = "Ma nhan vien hoac Email noi bo";
        document.getElementById('register-link-box').style.display = "none";
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;

    if (!account || !password) {
        alert("Vui long nhap tai khoan va mat khau!");
        return;
    }

    try {
        const credentials = {
            username: account,
            password: password
        };

        const responseData = currentRole === 'reader'
            ? await window.API.auth.loginReader(credentials)
            : await window.API.auth.loginEmployee(credentials);
        const authData = responseData?.user
            ? responseData
            : {
                role: responseData?.role || (currentRole === 'reader' ? 'reader' : 'employee'),
                user: responseData
            };

        if (!authData.user) {
            throw new Error("Backend chua tra ve thong tin nguoi dung.");
        }
        
        const position = authData.user.ChucVu || authData.user.chucVu || "";
        const normalizedRole = position.toLowerCase() === "quanly"
            ? "manager"
            : authData.role;

        localStorage.setItem("authUser", JSON.stringify(authData.user));
        localStorage.setItem("authRole", normalizedRole);

        alert(`Dang nhap thanh cong: ${account}`);
        window.location.href = "../index.html";
    } catch (error) {
        console.error("Login error:", error);
        alert(error.message || "Khong the ket noi den Backend. Vui long thu lai!");
    }
}
