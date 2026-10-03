document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "";
    let customers = [];

    // ================================
    // OWNER
    // ================================

    function loadOwnerInfo() {
        try {
            const user = JSON.parse(
                localStorage.getItem("spc_user") || "null"
            );

            if (!user) return;

            const name =
                user.name ||
                user.email ||
                "Owner";

            document.getElementById("ownerName").textContent = name;

            document.getElementById("ownerAvatar").textContent =
                name.charAt(0).toUpperCase();

        } catch (error) {
            console.error("Owner info error:", error);
        }
    }

    // ================================
    // RUPIAH
    // ================================

    function formatRupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    // ================================
    // DATE
    // ================================

    function formatDate(value) {
        if (!value) return "-";

        return new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // ================================
    // LOAD CUSTOMERS
    // ================================

    async function loadCustomers() {

        const token =
            localStorage.getItem("spc_token");

        if (!token) {
            window.location.href = "../login.html";
            return;
        }

        try {

            const response = await fetch(
                API_URL + "/api/owner/customers",
                {
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

            if (response.status === 401) {

                localStorage.removeItem("spc_token");
                localStorage.removeItem("spc_user");

                window.location.href =
                    "../login.html";

                return;
            }

            const data =
                await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Gagal mengambil data pelanggan"
                );
            }

            customers =
                Array.isArray(data.customers)
                    ? data.customers
                    : [];

            updateStatistics(data.stats);
            renderCustomers();

        } catch (error) {

            console.error(
                "Load customers error:",
                error
            );

            document.getElementById(
                "customerList"
            ).innerHTML = `

                <div class="customer-empty">

                    <div class="customer-empty-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>

                    <h4>
                        Gagal memuat pelanggan
                    </h4>

                    <p>
                        ${escapeHtml(error.message)}
                    </p>

                </div>

            `;
        }
    }

    // ================================
    // STATISTICS
    // ================================

    function updateStatistics(stats) {

        stats = stats || {};

        document.getElementById(
            "totalCustomers"
        ).textContent =
            Number(stats.total || 0);

        document.getElementById(
            "newCustomers"
        ).textContent =
            Number(stats.newCustomers || 0);

        document.getElementById(
            "totalOrders"
        ).textContent =
            Number(stats.totalOrders || 0);

        document.getElementById(
            "activeCustomers"
        ).textContent =
            Number(stats.activeCustomers || 0);
    }

    // ================================
    // RENDER
    // ================================

    function renderCustomers() {

        const list =
            document.getElementById(
                "customerList"
            );

        const search =
            document.getElementById(
                "customerSearch"
            ).value
            .trim()
            .toLowerCase();

        const filtered =
            customers.filter(customer =>
                String(customer.customer_id)
                    .toLowerCase()
                    .includes(search)
            );

        if (filtered.length === 0) {

            list.innerHTML = `

                <div class="customer-empty">

                    <div class="customer-empty-icon">

                        <i class="fa-solid fa-users"></i>

                    </div>

                    <h4>
                        ${
                            customers.length === 0
                                ? "Belum ada pelanggan"
                                : "Pelanggan tidak ditemukan"
                        }
                    </h4>

                    <p>
                        ${
                            customers.length === 0
                                ? "Data pelanggan akan muncul setelah identitas customer tersedia pada pesanan."
                                : "Coba gunakan kata pencarian lain."
                        }
                    </p>

                </div>

            `;

            return;
        }

        list.innerHTML =
            filtered
                .map(customer =>
                    createCustomerCard(customer)
                )
                .join("");
    }

    // ================================
    // CARD
    // ================================

    function createCustomerCard(customer) {

        const id =
            customer.customer_id;

        const initial =
            String(id)
                .charAt(0)
                .toUpperCase();

        return `

            <div class="customer-card">

                <div class="customer-info">

                    <div class="customer-avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div>

                        <h4>
                            Customer #${escapeHtml(id)}
                        </h4>

                        <span>
                            ID pelanggan: ${escapeHtml(id)}
                        </span>

                    </div>

                </div>

                <div class="customer-meta">

                    <div class="customer-meta-item">

                        <span>
                            Pesanan
                        </span>

                        <strong>
                            ${Number(customer.total_orders)}
                        </strong>

                    </div>

                    <div class="customer-meta-item">

                        <span>
                            Total Belanja
                        </span>

                        <strong>
                            ${formatRupiah(
                                customer.total_spending
                            )}
                        </strong>

                    </div>

                    <div class="customer-meta-item">

                        <span>
                            Pesanan Terakhir
                        </span>

                        <strong>
                            ${formatDate(
                                customer.last_order
                            )}
                        </strong>

                    </div>

                </div>

            </div>

        `;
    }

    // ================================
    // SEARCH
    // ================================

    document
        .getElementById("customerSearch")
        .addEventListener(
            "input",
            renderCustomers
        );

    // ================================
    // ESCAPE
    // ================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ================================
    // START
    // ================================

    loadOwnerInfo();
    loadCustomers();

});