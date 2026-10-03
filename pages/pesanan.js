document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "";
    let orders = [];
    let currentFilter = "all";

    // ================================
    // OWNER INFO
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
            console.error("Gagal membaca data owner:", error);
        }
    }

    // ================================
    // FORMAT RUPIAH
    // ================================

    function formatRupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    // ================================
    // FORMAT TANGGAL
    // ================================

    function formatDate(value) {
        if (!value) return "-";

        const date = new Date(value);

        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // ================================
    // STATUS
    // ================================

    function getStatusLabel(status) {
        const labels = {
            pending: "Menunggu",
            processing: "Diproses",
            completed: "Selesai",
            cancelled: "Dibatalkan"
        };

        return labels[status] || status;
    }

    function getStatusClass(status) {
        return {
            pending: "status-pending",
            processing: "status-processing",
            completed: "status-completed",
            cancelled: "status-cancelled"
        }[status] || "status-pending";
    }

    function getStatusIcon(status) {
        return {
            pending: "fa-hourglass-half",
            processing: "fa-spinner",
            completed: "fa-circle-check",
            cancelled: "fa-circle-xmark"
        }[status] || "fa-circle";
    }

    // ================================
    // LOAD ORDERS
    // ================================

    async function loadOrders() {

        const token =
            localStorage.getItem("spc_token");

        if (!token) {
            window.location.href = "../login.html";
            return;
        }

        try {

            const response = await fetch(
                API_URL + "/api/owner/orders",
                {
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                }
            );

            if (response.status === 401) {

                localStorage.removeItem("spc_token");
                localStorage.removeItem("spc_user");

                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal mengambil pesanan"
                );
            }

            orders =
                Array.isArray(data.orders)
                    ? data.orders
                    : [];

            updateStatistics();
            renderOrders();

        } catch (error) {

            console.error(
                "Load orders error:",
                error
            );

            document.getElementById("orderList").innerHTML = `
                <div class="order-empty">

                    <div class="order-empty-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>

                    <h4>
                        Gagal memuat pesanan
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

    function updateStatistics() {

        const total =
            orders.length;

        const pending =
            orders.filter(
                order =>
                    order.status === "pending"
            ).length;

        const processing =
            orders.filter(
                order =>
                    order.status === "processing"
            ).length;

        const completed =
            orders.filter(
                order =>
                    order.status === "completed"
            ).length;

        document.getElementById(
            "totalOrders"
        ).textContent = total;

        document.getElementById(
            "pendingOrders"
        ).textContent = pending;

        document.getElementById(
            "processingOrders"
        ).textContent = processing;

        document.getElementById(
            "completedOrders"
        ).textContent = completed;
    }

    // ================================
    // RENDER ORDERS
    // ================================

    function renderOrders() {

        const orderList =
            document.getElementById("orderList");

        let filteredOrders = orders;

        if (currentFilter !== "all") {
            filteredOrders =
                orders.filter(
                    order =>
                        order.status === currentFilter
                );
        }

        if (filteredOrders.length === 0) {

            orderList.innerHTML = `
                <div class="order-empty">

                    <div class="order-empty-icon">
                        <i class="fa-solid fa-receipt"></i>
                    </div>

                    <h4>
                        Belum ada pesanan
                    </h4>

                    <p>
                        ${
                            currentFilter === "all"
                                ? "Pesanan pelanggan akan muncul di halaman ini."
                                : "Tidak ada pesanan dengan status ini."
                        }
                    </p>

                </div>
            `;

            return;
        }

        orderList.innerHTML =
            filteredOrders
                .map(order => createOrderCard(order))
                .join("");

        // Pasang event listener status
        document
            .querySelectorAll(".order-status-select")
            .forEach(select => {

                select.addEventListener(
                    "change",
                    function () {

                        const orderId =
                            Number(this.dataset.orderId);

                        const status =
                            this.value;

                        changeOrderStatus(
                            orderId,
                            status
                        );
                    }
                );

            });
    }

    // ================================
    // CREATE ORDER CARD
    // ================================

    function createOrderCard(order) {

        const items =
            Array.isArray(order.items)
                ? order.items
                : [];

        const itemsHtml =
            items.length > 0

                ? items.map(item => `

                    <div class="order-item">

                        <div class="order-item-name">

                            <span>
                                ${escapeHtml(item.product_name)}
                            </span>

                            <span class="order-item-qty">
                                × ${Number(item.quantity)}
                            </span>

                        </div>

                        <span class="order-item-price">
                            ${formatRupiah(item.subtotal)}
                        </span>

                    </div>

                `).join("")

                : `

                    <div class="order-item">

                        <span>
                            Tidak ada detail produk
                        </span>

                    </div>

                `;

        return `

            <div class="order-card">

                <div class="order-card-top">

                    <div>

                        <span class="order-number">
                            ${escapeHtml(order.order_number)}
                        </span>

                        <span class="order-date">
                            ${formatDate(order.created_at)}
                        </span>

                    </div>

                    <span class="order-status ${getStatusClass(order.status)}">

                        <i class="fa-solid ${getStatusIcon(order.status)}"></i>

                        ${getStatusLabel(order.status)}

                    </span>

                </div>

                <div class="order-items">

                    ${itemsHtml}

                </div>

                <div class="order-card-bottom">

                    <div class="order-total">

                        <span>
                            Total Pesanan
                        </span>

                        <strong>
                            ${formatRupiah(order.total)}
                        </strong>

                    </div>

                    <div class="order-actions">

                        ${
                            order.status === "completed" ||
                            order.status === "cancelled"

                            ? `

                                <span class="order-status ${getStatusClass(order.status)}">

                                    ${getStatusLabel(order.status)}

                                </span>

                            `

                            : `

                                <select
                                    class="order-status-select"
                                    data-order-id="${Number(order.id)}"
                                >

                                    <option
                                        value="pending"
                                        ${order.status === "pending" ? "selected" : ""}
                                    >
                                        Menunggu
                                    </option>

                                    <option
                                        value="processing"
                                        ${order.status === "processing" ? "selected" : ""}
                                    >
                                        Diproses
                                    </option>

                                    <option
                                        value="completed"
                                        ${order.status === "completed" ? "selected" : ""}
                                    >
                                        Selesai
                                    </option>

                                    <option
                                        value="cancelled"
                                        ${order.status === "cancelled" ? "selected" : ""}
                                    >
                                        Dibatalkan
                                    </option>

                                </select>

                            `
                        }

                    </div>

                </div>

            </div>

        `;
    }

    // ================================
    // CHANGE STATUS
    // ================================

    async function changeOrderStatus(
        orderId,
        status
    ) {

        const token =
            localStorage.getItem("spc_token");

        if (!token) {
            window.location.href = "../login.html";
            return;
        }

        try {

            const response =
                await fetch(
                    API_URL +
                    "/api/owner/orders/" +
                    encodeURIComponent(orderId) +
                    "/status",
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " + token
                        },

                        body: JSON.stringify({
                            status: status
                        })
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
                    "Gagal mengubah status pesanan"
                );
            }

            const order =
                orders.find(
                    item =>
                        Number(item.id) ===
                        Number(orderId)
                );

            if (order) {
                order.status = status;
            }

            updateStatistics();
            renderOrders();

        } catch (error) {

            console.error(
                "Change order status error:",
                error
            );

            alert(
                error.message ||
                "Gagal mengubah status pesanan"
            );

            renderOrders();
        }
    }

    // ================================
    // FILTER
    // ================================

    const filterButton =
        document.getElementById(
            "orderFilterButton"
        );

    const filterMenu =
        document.getElementById(
            "orderFilterMenu"
        );

    const filterLabel =
        document.getElementById(
            "filterLabel"
        );

    filterButton.addEventListener(
        "click",
        function () {

            filterMenu.classList.toggle(
                "show"
            );

        }
    );

    document
        .querySelectorAll(
            "#orderFilterMenu button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    currentFilter =
                        this.dataset.filter;

                    filterLabel.textContent =
                        this.textContent;

                    filterMenu.classList.remove(
                        "show"
                    );

                    renderOrders();

                }
            );

        });

    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".order-filter"
                )
            ) {

                filterMenu.classList.remove(
                    "show"
                );

            }

        }
    );

    // ================================
    // ESCAPE HTML
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
    loadOrders();

});