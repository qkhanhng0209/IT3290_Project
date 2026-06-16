const BASE_URL = "http://localhost:3000/api";

// hàm gọi API chung
async function request(url, method = "GET", data = null) {
    try {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const res = await fetch(BASE_URL + url, options);

        if (!res.ok) {
            throw new Error("Lỗi API: " + res.status);
        }

        return await res.json();
    } catch (err) {
        console.error("API error:", err);
        return null;
    }
}

//// ===== BOOK API =====

// lấy danh sách
function getBooks() {
    return request("/books");
}

// thêm sách
function addBook(book) {
    return request("/books", "POST", book);
}

// xóa
function deleteBook(id) {
    return request(`/books/${id}`, "DELETE");
}

// tìm kiếm
function searchBooks(keyword) {
    return request(`/books?search=${encodeURIComponent(keyword)}`);
}

// export global
window.API = {
    getBooks,
    addBook,
    deleteBook,
    searchBooks
};
