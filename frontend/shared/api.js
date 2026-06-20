const BASE_URL = window.API_BASE_URL || "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
    const requestOptions = {
        ...options,
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
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
        deleteBook
    }
};
