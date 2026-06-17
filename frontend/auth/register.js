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

function handleRegister(event) {
    event.preventDefault(); 

    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    
    if (document.getElementById('email-error').innerText !== "" || 
        document.getElementById('phone-error').innerText !== "") {
        alert("Vui lòng sửa các lỗi đỏ trên màn hình trước khi đăng ký!");
        return;
    }

    const randomNumbers = Math.floor(1000 + Math.random() * 9000);
    const readerId = "VN" + randomNumbers;

    document.getElementById('assigned-id').innerText = readerId;
    document.getElementById('register-success').classList.remove('hidden');

    alert(`Đăng ký thành công!\nMã độc giả cấp mới: ${readerId}`);
}
