const token = localStorage.getItem("spc_token");

if (!token) {
    window.location.href = "../login.html";
}

const businessList = document.getElementById("reportBusinessList");
const reportDetail = document.getElementById("reportDetail");

const selectedBusinessName =
    document.getElementById("selectedBusinessName");

const selectedBusinessOwner =
    document.getElementById("selectedBusinessOwner");

const businessTotalOrders =
    document.getElementById("businessTotalOrders");

const businessTotalRevenue =
    document.getElementById("businessTotalRevenue");

const reportSummary =
    document.getElementById("reportSummary");


let businesses = [];


/* =========================
   FORMAT
========================= */

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}


function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}


/* =========================
   LOAD BUSINESS
========================= */

async function loadBusinesses() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/admin/businesses",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Gagal mengambil data bisnis"
            );
        }

        businesses = result.data || [];

        renderBusinessList();

    } catch (error) {
        console.error(error);

        businessList.innerHTML = `
            <div class="empty-state">
                Gagal memuat data bisnis.
            </div>
        `;
    }
}


/* =========================
   RENDER BUSINESS
========================= */

function renderBusinessList() {
    if (!businesses.length) {
        businessList.innerHTML = `
            <div class="empty-state">
                Belum ada bisnis yang terdaftar.
            </div>
        `;
        return;
    }

    businessList.innerHTML = businesses.map(business => `
        <div
            class="report-business-item"
            data-id="${business.id}"
        >
            <div class="report-business-icon">
                <i class="fa-solid fa-store"></i>
            </div>

            <div class="report-business-info">
                <h3>
                    ${escapeHTML(business.business_name)}
                </h3>

                <p>
                    Owner:
                    ${escapeHTML(business.owner_name || "-")}
                </p>

                <span>
                    ${escapeHTML(business.category || "Tanpa kategori")}
                </span>
            </div>

            <div class="report-business-arrow">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </div>
    `).join("");

    document
        .querySelectorAll(".report-business-item")
        .forEach(item => {
            item.addEventListener("click", () => {
                loadBusinessReport(item.dataset.id);
            });
        });
}


/* =========================
   LOAD BUSINESS REPORT
========================= */

async function loadBusinessReport(businessId) {
    try {
        reportDetail.classList.remove("hidden");

        selectedBusinessName.textContent = "Memuat...";
        selectedBusinessOwner.textContent = "";
        businessTotalOrders.textContent = "0";
        businessTotalRevenue.textContent = "Rp0";

        const response = await fetch(
            `http://localhost:3000/api/admin/reports?business_id=${businessId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
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
            data.business.business_name;

        selectedBusinessOwner.textContent =
            `Owner: ${data.business.owner_name || "-"}`;

        businessTotalOrders.textContent =
            data.total_orders;

        businessTotalRevenue.textContent =
            formatRupiah(data.total_revenue);

        reportSummary.innerHTML = `
            <div class="report-summary-item">
                <span>Total Pesanan</span>
                <strong>
                    ${data.total_orders}
                </strong>
            </div>

            <div class="report-summary-item">
                <span>Total Pendapatan</span>
                <strong>
                    ${formatRupiah(data.total_revenue)}
                </strong>
            </div>
        `;

        document
            .querySelectorAll(".report-business-item")
            .forEach(item => {
                item.classList.remove("active");

                if (item.dataset.id === String(businessId)) {
                    item.classList.add("active");
                }
            });

    } catch (error) {
        console.error(error);

        selectedBusinessName.textContent =
            "Gagal memuat laporan";

        selectedBusinessOwner.textContent = "";

        businessTotalOrders.textContent = "0";
        businessTotalRevenue.textContent = "Rp0";

        reportSummary.innerHTML = `
            <div class="empty-state">
                Gagal mengambil laporan bisnis.
            </div>
        `;
    }
}


/* =========================
   START
========================= */

loadBusinesses();