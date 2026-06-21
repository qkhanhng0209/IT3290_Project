const BASE_URL = window.API_BASE_URL || "/api";

async function apiRequest(path, options = {}) {
    const authRole = typeof localStorage !== 'undefined' ? localStorage.getItem('authRole') : null;
    const requestOptions = {
        ...options,
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(authRole ? { "X-Auth-Role": authRole } : {}),
            ...(options.headers || {})
        }
    };

    const response = await fetch(BASE_URL + path, requestOptions);
    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        result = null;
    }

    if (!response.ok) {
        const message = result?.message || result?.error || `Loi API: ${response.status}`;
        throw new Error(message);
    }

    if (result?.success === false) {
        throw new Error(result.message || "Yeu cau khong thanh cong.");
    }

    if (result && Object.prototype.hasOwnProperty.call(result, "data")) {
        return result.data;
    }

    return result;
}

function getBooks() {
    return apiRequest("/books");
}

function getBookByISBN(isbn) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}`);
}

function searchBooks(keyword, type = "all") {
    const query = new URLSearchParams({ q: keyword, type });
    return apiRequest(`/books/search?${query.toString()}`);
}

function addBook(book) {
    return apiRequest("/books", {
        method: "POST",
        body: JSON.stringify(book)
    });
}

function updateBook(isbn, book) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}`, {
        method: "PUT",
        body: JSON.stringify(book)
    });
}

function deleteBook(isbn) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}`, {
        method: "DELETE"
    });
}

function getBookCopies(isbn) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}/copies`);
}

function addBookCopies(isbn, copies) {
    return apiRequest(`/books/${encodeURIComponent(isbn)}/copies`, {
        method: "POST",
        body: JSON.stringify(copies)
    });
}

function updateBookCopy(maSach, copy) {
    return apiRequest(`/books/copies/${encodeURIComponent(maSach)}`, {
        method: "PUT",
        body: JSON.stringify(copy)
    });
}

function loginReader(credentials) {
    return apiRequest("/auth/login-reader", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
}

function loginEmployee(credentials) {
    return apiRequest("/auth/login-employee", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
}

function registerReader(reader) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(reader)
    });
}

// Members API functions
function getMembers() {
    return apiRequest("/members");
}

function getNhanvien() {
    return apiRequest("/nhanvien");
}

function getNhanvienById(ma_nhan_vien) {
    return apiRequest(`/nhanvien/${ma_nhan_vien}`);
}

function addNhanvien(data) {
    return apiRequest("/nhanvien", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

function updateNhanvien(maNhanVien, data) {
    return apiRequest(`/nhanvien/${maNhanVien}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

function getMemberById(maDocGia) {
    return apiRequest(`/members/${maDocGia}`);
}

function addMember(member) {
    return apiRequest("/members", {
        method: "POST",
        body: JSON.stringify(member)
    });
}

function updateMember(maDocGia, member) {
    return apiRequest(`/members/${maDocGia}`, {
        method: "PUT",
        body: JSON.stringify(member)
    });
}

function deleteMember(maDocGia) {
    return apiRequest(`/members/${maDocGia}`, {
        method: "DELETE"
    });
}

function activateMember(maDocGia) {
    return apiRequest(`/members/${maDocGia}/activate`, {
        method: "PUT"
    });
}

window.apiRequest = apiRequest;

window.API = {
    auth: {
        loginReader,
        loginEmployee,
        registerReader
    },
    books: {
        getBooks,
        getBookByISBN,
        searchBooks,
        addBook,
        updateBook,
        deleteBook,
        getBookCopies,
        addBookCopies,
        updateBookCopy
    },
    members: {
        getMembers,
        getMemberById,
        addMember,
        updateMember,
        deleteMember,
        activateMember
    },
    nhanvien: {
        getNhanvien,
        getNhanvienById,
        addNhanvien,
        updateNhanvien
    }
};
