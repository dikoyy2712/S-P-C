const token = localStorage.getItem("spc_token");
const user = JSON.parse(localStorage.getItem("spc_user"));

if (!token || !user) {
    window.location.href = "../login.html";
}

// Menentukan halaman berdasarkan role
const currentPage = window.location.pathname.split("/").pop();

const adminPages = [
    "admin-dashboard.html",
    "verifikasi-bisnis.html",
    "admin-bisnis.html"
];

const ownerPages = [
    "dashboard.html",
    "profil-bisnis.html",
    "produk-layanan.html",
    "pesanan.html",
    "pelanggan.html",
    "statistik.html",
    "qr-code.html",
    "pengaturan.html"
];

const customerPages = [
    "customer.html"
];

// Admin hanya boleh halaman Admin
if (adminPages.includes(currentPage) && user.role !== "admin") {
    window.location.href = "../login.html";
}

// Customer hanya boleh halaman Customer
if (customerPages.includes(currentPage) && user.role !== "customer" && user.role !== "owner") {
    window.location.href = "../login.html";
}
// Halaman Owner hanya boleh diakses Owner
if (ownerPages.includes(currentPage) && user.role !== "owner") {
    window.location.href = "../login.html";
}