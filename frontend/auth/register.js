function validateName() {
    const name = document.getElementById('reg-name').value.trim();
    const errorSpan = document.getElementById('name-error');

    if (name === "") {
        errorSpan.innerText = "Ho ten khong duoc de trong!";
        return false;
    } else {
        errorSpan.innerText = "";
        return true;
    }
}

function validateEmail() {
    const email = document.getElementById('reg-email').value.trim();
    const errorSpan = document.getElementById('email-error');

    if (email === "") {
        errorSpan.innerText = "Email khong duoc de trong!";
        return false;
    } else if (!email.endsWith('@gmail.com')) {
        errorSpan.innerText = "Email phai co duoi @gmail.com!";
        return false;
    } else {
        errorSpan.innerText = "";
        return true;
    }
}

function validatePhone() {
    const phone = document.getElementById('reg-phone').value.trim();
    const errorSpan = document.getElementById('phone-error');

    if (phone === "") {
        errorSpan.innerText = "So dien thoai khong duoc de trong!";
        return false;
    } else if (!/^\d{10}$/.test(phone)) {
        errorSpan.innerText = "So dien thoai phai co dung 10 chu so!";
        return false;
    } else {
        errorSpan.innerText = "";
        return true;
    }
}

document.getElementById('reg-name').addEventListener('blur', validateName);
document.getElementById('reg-email').addEventListener('blur', validateEmail);
document.getElementById('reg-phone').addEventListener('blur', validatePhone);

async function handleRegister(event) {
    event.preventDefault();

    const hoTen = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const gender = document.querySelector('input[name="reg-gender"]:checked')?.value || null;

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isPasswordValid = password.length >= 6;

    if (!isPasswordValid) {
        document.getElementById('password-error').innerText = "Mat khau phai co toi thieu 6 ky tu!";
    } else {
        document.getElementById('password-error').innerText = "";
    }

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid) {
        alert("Vui long sua loi tren man hinh truoc khi dang ky!");
        return;
    }

    const registerData = {
        hoTen: hoTen,
        email: email,
        soDienThoai: phone,
        matKhau: password,
        gioiTinh: gender
    };

    const submitButton = event.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        document.getElementById('assigned-id').innerText = "Dang cap phat ma...";

        const data = await window.API.auth.registerReader(registerData);
        const readerId = data?.maDocGia ||
            data?.MaDocGia ||
            data?.ma_doc_gia ||
            data?.data?.maDocGia ||
            data?.data?.MaDocGia ||
            data?.data?.ma_doc_gia;

        if (!readerId) {
            throw new Error("Backend chua tra ve MaDocGia duoc cap tu database.");
        }

        document.getElementById('assigned-id').innerText = readerId;
        document.getElementById('register-success').classList.remove('hidden');

        alert(`Dang ky thanh cong!\nMa doc gia cap moi: ${readerId}`);
    } catch (error) {
        console.error("Register error:", error);
        document.getElementById('assigned-id').innerText = "Loi!";
        alert(error.message || "Khong the ket noi den Backend. Vui long thu lai sau!");
    } finally {
        submitButton.disabled = false;
    }
}
