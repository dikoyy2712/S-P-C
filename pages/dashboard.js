const API_URL = "";


// ================================
// HELPER
// ================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatRupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );

}


function formatDate(value) {

    return new Date(value).toLocaleString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function statusLabel(status) {

    const labels = {
        pending: "Menunggu",
        processing: "Diproses",
        completed: "Selesai",
        cancelled: "Dibatalkan"
    };

    return labels[status] || status;

}


// ================================
// OWNER INFO
// ================================

function loadOwnerInfo() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem(
                    "spc_user"
                ) || "null"
            );

        if (!user) return;

        const name =
            user.name ||
            user.email ||
            "Owner";

        document.getElementById(
            "ownerName"
        ).textContent = name;

        document.getElementById(
            "welcomeName"
        ).textContent =
            `Halo, ${name} 👋`;

        document.getElementById(
            "ownerAvatar"
        ).textContent =
            name
                .charAt(0)
                .toUpperCase();

    } catch (error) {

        console.error(
            "Owner info error:",
            error
        );

    }

}


// ================================
// LOAD DASHBOARD
// ================================

async function loadDashboard() {

    const token =
        localStorage.getItem(
            "spc_token"
        );


    if (!token) {

        window.location.href =
            "../login.html";

        return;

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/api/owner/dashboard-summary",
                {
                    headers: {
                        "Authorization":
                            "Bearer " +
                            token
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "spc_token"
            );

            localStorage.removeItem(
                "spc_user"
            );

            window.location.href =
                "../login.html";

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Gagal mengambil dashboard"
            );

        }


        renderDashboard(
            data.dashboard
        );

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        document.getElementById(
            "activityChart"
        ).innerHTML = `

            <div class="dashboard-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                Gagal memuat dashboard

                <br>

                <small>
                    ${escapeHtml(error.message)}
                </small>

            </div>

        `;

        document.getElementById(
            "recentOrders"
        ).innerHTML = `

            <div class="dashboard-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                Gagal memuat pesanan

            </div>

        `;

    }

}


// ================================
// RENDER DASHBOARD
// ================================

function renderDashboard(data) {

    document.getElementById(
        "ordersToday"
    ).textContent =
        Number(
            data.ordersToday || 0
        );


    document.getElementById(
        "totalCustomers"
    ).textContent =
        Number(
            data.totalCustomers || 0
        );


    document.getElementById(
        "totalProducts"
    ).textContent =
        Number(
            data.totalProducts || 0
        );


    document.getElementById(
        "revenueMonth"
    ).textContent =
        formatRupiah(
            data.revenueMonth
        );


    // STATUS BISNIS

    const status =
        data.businessStatus;

    const statusElement =
        document.getElementById(
            "businessStatus"
        );

    const statusMap = {

        active: "Bisnis Aktif",

        approved: "Bisnis Aktif",

        pending: "Menunggu Verifikasi",

        rejected: "Ditolak"

    };

    statusElement.textContent =
        statusMap[status] ||
        status ||
        "Belum tersedia";


    renderChart(
        data.chart || []
    );


    renderRecentOrders(
        data.recentOrders || []
    );

}


// ================================
// CHART
// ================================

function renderChart(data) {

    const container =
        document.getElementById(
            "activityChart"
        );


    const days = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setHours(
            0,
            0,
            0,
            0
        );

        date.setDate(
            date.getDate() - i
        );


        const key =
            date
                .toISOString()
                .split("T")[0];


        const found =
            data.find(
                item =>
                    String(
                        item.order_date
                    ).slice(0, 10) === key
            );


        days.push({

            date,

            total: found
                ? Number(found.total)
                : 0

        });

    }


    const max =
        Math.max(
            ...days.map(
                day => day.total
            ),
            1
        );


    container.innerHTML =
        days.map(day => {

            const label =
                day.date.toLocaleDateString(
                    "id-ID",
                    {
                        weekday: "short"
                    }
                ).replace(
                    ".",
                    ""
                );


            const height =
                day.total === 0
                    ? 4
                    : Math.max(
                        8,
                        (
                            day.total /
                            max
                        ) * 100
                    );


            return `

                <div class="dashboard-chart-day">

                    <span class="dashboard-chart-value">
                        ${day.total}
                    </span>

                    <div class="dashboard-chart-bar-area">

                        <div
                            class="dashboard-chart-bar"
                            style="height:${height}%"
                        ></div>

                    </div>

                    <span class="dashboard-chart-label">
                        ${escapeHtml(label)}
                    </span>

                </div>

            `;

        }).join("");

}


// ================================
// RECENT ORDERS
// ================================

function renderRecentOrders(orders) {

    const container =
        document.getElementById(
            "recentOrders"
        );


    if (!orders.length) {

        container.innerHTML = `

            <div class="dashboard-empty">

                <i class="fa-solid fa-cart-shopping"></i>

                <h4>
                    Belum ada pesanan
                </h4>

                <p>
                    Pesanan dari customer akan
                    muncul di sini.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        orders.map(order => {

            const status =
                escapeHtml(
                    order.status
                );


            return `

                <div class="dashboard-order">

                    <div class="dashboard-order-info">

                        <div class="dashboard-order-number">
                            ${escapeHtml(
                                order.order_number
                            )}
                        </div>

                        <span class="dashboard-order-date">
                            ${formatDate(
                                order.created_at
                            )}
                        </span>

                    </div>

                    <div class="dashboard-order-right">

                        <div class="dashboard-order-total">
                            ${formatRupiah(
                                order.total
                            )}
                        </div>

                        <span class="dashboard-order-status ${status}">
                            ${statusLabel(
                                order.status
                            )}
                        </span>

                    </div>

                </div>

            `;

        }).join("");

}


// ================================
// START
// ================================

loadOwnerInfo();

loadDashboard();