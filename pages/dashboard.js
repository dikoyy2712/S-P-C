document.addEventListener("DOMContentLoaded", () => {
    loadOwnerDashboard();
});

async function loadOwnerDashboard() {
    const userData = localStorage.getItem("spc_user");

    if (!userData) {
        window.location.href = "../login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("spc_user");
        localStorage.removeItem("spc_token");
        window.location.href = "../login.html";
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/owner/dashboard?owner_id=${encodeURIComponent(user.id)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengambil dashboard");
        }

        const data = result.data;

        setText("ownerName", user.name || "Owner");
        setText("welcomeName", `Halo, ${user.name || "Owner"} 👋`);

        const businessStatus = document.getElementById("businessStatus");

        if (businessStatus) {
            if (!data.business) {
                businessStatus.textContent = "Belum Ada Bisnis";
            } else if (data.business.verification_status === "approved") {
                businessStatus.textContent = "Bisnis Aktif";
            } else if (data.business.verification_status === "pending") {
                businessStatus.textContent = "Menunggu Verifikasi";
            } else {
                businessStatus.textContent = "Bisnis Belum Aktif";
            }
        }

        setText("ordersToday", data.orders_today);
        setText("totalCustomers", data.total_customers);
        setText("totalProducts", data.total_products);
        setText("revenueMonth", formatRupiah(data.revenue_month));

        renderRecentOrders(data.recent_orders || []);
        renderActivityChart(data.activity || []);

    } catch (error) {
        console.error("Gagal memuat dashboard owner:", error);
        showDashboardError(error.message);
    }
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function renderRecentOrders(orders) {
    const orderList = document.getElementById("recentOrders");
    if (!orderList) return;

    if (!orders.length) {
        orderList.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">
                    <i class="fa-solid fa-receipt"></i>
                </div>
                <h4>Belum ada pesanan</h4>
                <p>Pesanan pelanggan akan muncul di sini.</p>
            </div>
        `;
        return;
    }

    orderList.innerHTML = orders.map(order => `
        <div class="owner-order">
            <div class="order-icon">
                <i class="fa-solid fa-receipt"></i>
            </div>

            <div>
                <strong>${escapeHtml(order.order_number)}</strong>
                <span>${formatRupiah(order.total)}</span>
            </div>

            <span class="${getOrderStatusClass(order.status)}">
                ${escapeHtml(formatOrderStatus(order.status))}
            </span>
        </div>
    `).join("");
}

function renderActivityChart(activity) {
    const chartBars = document.querySelector(".chart-bars");
    const chartDays = document.querySelector(".chart-days");

    if (!chartBars || !chartDays) return;

    if (!activity.length) {
        chartBars.innerHTML = Array.from({ length: 7 }, () =>
            '<span style="height: 4%"></span>'
        ).join("");
        chartDays.innerHTML = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
            .map(day => `<span>${day}</span>`)
            .join("");
        return;
    }

    const max = Math.max(...activity.map(item => Number(item.total) || 0), 1);

    chartBars.innerHTML = activity.map(item => {
        const total = Number(item.total) || 0;
        const height = total === 0 ? 4 : Math.max(8, Math.round((total / max) * 100));
        return `<span style="height: ${height}%" title="${total} pesanan"></span>`;
    }).join("");

    chartDays.innerHTML = activity.map(item =>
        `<span>${escapeHtml(item.day)}</span>`
    ).join("");
}

function showDashboardError(message) {
    const orderList = document.getElementById("recentOrders");
    if (!orderList) return;

    orderList.innerHTML = `
        <div class="admin-empty">
            <div class="admin-empty-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4>Data dashboard belum dapat dimuat</h4>
            <p>${escapeHtml(message || "Periksa koneksi backend dan database.")}</p>
        </div>
    `;
}

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function formatOrderStatus(status) {
    const statusMap = {
        pending: "Menunggu",
        processing: "Diproses",
        completed: "Selesai",
        cancelled: "Dibatalkan"
    };

    return statusMap[status] || status || "Menunggu";
}

function getOrderStatusClass(status) {
    const classMap = {
        pending: "status-processing",
        processing: "status-processing",
        completed: "status-complete",
        cancelled: "status-cancelled"
    };

    return classMap[status] || "status-processing";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
