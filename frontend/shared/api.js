// URL gốc của backend Flask
// Flask mặc định chạy ở port 5000, các API đều bắt đầu bằng /api
const BASE_URL = "http://localhost:5000/api";

/**
 * Hàm gọi API chung cho toàn bộ frontend.
 *
 * Cách dùng:
 *   const books = await apiRequest("/books");
 *
 *   const result = await apiRequest("/books", {
 *       method: "POST",
 *       body: JSON.stringify(book)
 *   });
 *
 * Quy ước:
 * - Backend trả JSON dạng: { success: true, data: ... }
 * - Nếu backend trả lỗi: { success: false, message: "..." }
 * - Hàm này trả thẳng phần data để file JS của từng trang dùng cho gọn.
 */

async function apiRequest(path, options = {}) {
    try {
        const requestOptions = {
            ...options,

            method: options.method || "GET",

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
        };

        const response = await fetch(BASE_URL + path, requestOptions);

        let result = null;

        // Một số response có thể không có body.
        // Vì vậy cần try/catch khi parse JSON.
        try {
            result = await response.json();
        } catch (error) {
            result = null;
        }

        // Lỗi HTTP, ví dụ 400, 404, 500.
        if (!response.ok) {
            const message =
                result?.message ||
                `Lỗi API: ${response.status}`;

            throw new Error(message);
        }

        // Backend trả đúng format nhưng báo thất bại nghiệp vụ.
        if (result && result.success === false) {
            throw new Error(
                result.message || "Yêu cầu không thành công."
            );
        }

        // Chuẩn chung của project: { success: true, data: ... }
        // Trả thẳng data để các trang dễ render.
        if (result && Object.prototype.hasOwnProperty.call(result, "data")) {
            return result.data;
        }

        // Fallback cho API cũ chưa theo chuẩn.
        return result;

    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

/*
    Book API helpers
*/

// Lấy danh sách sách
function getBooks() {
    return apiRequest("/books");
}

// Lấy chi tiết 1 đầu sách theo ISBN
function getBookByISBN(isbn) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}`);
}

// Tìm kiếm sách
// type có thể là: all, isbn, title, author, category
function searchBooks(keyword, type = "all") {
    const query = new URLSearchParams({
        q: keyword,
        type
    });

    return apiRequest(`/books/search?${query.toString()}`);
}

// Thêm sách
function addBook(book) {
    return apiRequest("/books", {
        method: "POST",
        body: JSON.stringify(book)
    });
}

// Cập nhật sách
function updateBook(isbn, book) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}`, {
        method: "PUT",
        body: JSON.stringify(book)
    });
}

// Xóa sách
function deleteBook(isbn) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}`, {
        method: "DELETE"
    });
}

/*
    Export global
*/

// Export hàm gọi API chung.
// Các file như borrowing.js, returns.js đang dùng apiRequest trực tiếp.

window.apiRequest = apiRequest;

// Export nhóm API theo module
// Các trang mới nên ưu tiên dùng window.API.books.getBooks(), ...
window.API = {
    books: {
        getBooks,
        getBookByISBN,
        searchBooks,
        addBook,
        updateBook,
        deleteBook
    }
};