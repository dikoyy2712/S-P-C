const spcToken = localStorage.getItem("spc_token");

if (!spcToken) {
    window.location.href = "../login.html";
}

const businessList = document.getElementById("reportBusinessList");
const reportDetail = document.getElementById("reportDetail");
const selectedBusinessName = document.getElementById("selectedBusinessName");
const selectedBusinessOwner = document.getElementById("selectedBusinessOwner");
const businessTotalOrders = document.getElementById("businessTotalOrders");
const businessTotalRevenue = document.getElementById("businessTotalRevenue");
const reportSummary = document.getElementById("reportSummary");

let businesses = [];

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function loadBusinesses() {
    try {
        const response = await fetch("/api/admin/businesses", {
            headers: {
                Authorization: `Bearer ${spcToken}`
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Gagal mengambil data bisnis"
            );
        }

        businesses = result.data || [];

        renderBusinessList();

    } catch (error) {
        console.error("Gagal memuat bisnis:", error);

        businessList.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h4>Gagal memuat bisnis</h4>

                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}

function renderBusinessList() {
    if (!businesses.length) {
        businessList.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">
                    <i class="fa-solid fa-store"></i>
                </div>

                <h4>Belum ada bisnis</h4>

                <p>
                    Belum ada bisnis yang terdaftar di SPC.
                </p>
            </div>
        `;

        return;
    }

    businessList.innerHTML = businesses.map(function (business) {
        return `
            <div class="report-business-item" data-id="${business.id}">

                <div class="report-business-icon">
                    <i class="fa-solid fa-store"></i>
                </div>

                <div class="report-business-info">

                    <h3>
                        ${escapeHTML(
                            business.business_name || "Tanpa Nama"
                        )}
                    </h3>

                    <p>
                        Owner:
                        ${escapeHTML(
                            business.owner_name || "-"
                        )}
                    </p>

                    <span>
                        ${escapeHTML(
                            business.category || "Tanpa kategori"
                        )}
                    </span>

                </div>

                <div class="report-business-arrow">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>

            </div>
        `;
    }).join("");

    document
        .querySelectorAll(".report-business-item")
        .forEach(function (item) {
            item.addEventListener("click", function () {
                loadBusinessReport(this.dataset.id);
            });
        });
}

function showBusinessList() {
    reportDetail.classList.add("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    document
        .querySelectorAll(".report-business-item")
        .forEach(function (item) {
            item.classList.remove("active");
        });
}

async function loadBusinessReport(businessId) {
    try {
        reportDetail.classList.remove("hidden");

        selectedBusinessName.textContent = "Memuat...";
        selectedBusinessOwner.textContent = "";
        businessTotalOrders.textContent = "0";
        businessTotalRevenue.textContent = "Rp 0";

        reportSummary.innerHTML = `
            <div class="report-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Memuat laporan bisnis...</span>
            </div>
        `;

        const response = await fetch(
            `/api/admin/reports?business_id=${encodeURIComponent(businessId)}`,
            {
                headers: {
                    Authorization: `Bearer ${spcToken}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Gagal mengambil laporan bisnis"
            );
        }

        const data = result.data;

        selectedBusinessName.textContent =
            data.business.business_name || "Tanpa Nama";

        selectedBusinessOwner.textContent =
            `Owner: ${data.business.owner_name || "-"}`;

        businessTotalOrders.textContent =
            data.total_orders || 0;

        businessTotalRevenue.textContent =
            formatRupiah(data.total_revenue);

        reportSummary.innerHTML = `
            <div class="report-summary-item">
                <div class="summary-icon">
                    <i class="fa-solid fa-receipt"></i>
                </div>

                <div>
                    <span>Total Pesanan</span>
                    <strong>
                        ${data.total_orders || 0}
                    </strong>
                </div>
            </div>

            <div class="report-summary-item">
                <div class="summary-icon">
                    <i class="fa-solid fa-wallet"></i>
                </div>

                <div>
                    <span>Total Pendapatan</span>
                    <strong>
                        ${formatRupiah(data.total_revenue)}
                    </strong>
                </div>
            </div>
        `;

        document
            .querySelectorAll(".report-business-item")
            .forEach(function (item) {
                item.classList.remove("active");

                if (item.dataset.id === String(businessId)) {
                    item.classList.add("active");
                }
            });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (error) {
        console.error("Gagal memuat laporan:", error);

        selectedBusinessName.textContent =
            "Gagal memuat laporan";

        selectedBusinessOwner.textContent = "";
        businessTotalOrders.textContent = "0";
        businessTotalRevenue.textContent = "Rp 0";

        reportSummary.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h4>Gagal mengambil laporan</h4>

                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}
const reportBackButton =
    document.getElementById("reportBackButton");

reportBackButton.addEventListener(
    "click",
    showBusinessList
);
loadBusinesses();