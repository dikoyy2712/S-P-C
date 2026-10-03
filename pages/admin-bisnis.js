document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    const totalBusiness =
        document.getElementById("totalBusiness");

    const pendingBusiness =
        document.getElementById("pendingBusiness");

    const activeBusiness =
        document.getElementById("activeBusiness");

    const totalOwner =
        document.getElementById("totalOwner");

    const businessTable =
        document.getElementById("businessTable");


    // ===============================
    // QUICK ACTION
    // ===============================

    const quickActions =
        document.querySelectorAll(".quick-actions a");

    if (quickActions[3]) {
        quickActions[3].href = "admin-laporan.html";
    }


    // ===============================
    // LOAD DATA
    // ===============================

    async function loadBusinesses() {

        try {

            const [businessResponse, reportResponse] =
                await Promise.all([

                    fetch("/api/admin/businesses"),

                    fetch("/api/admin/reports")

                ]);


            const businessResult =
                await businessResponse.json();

            const reportResult =
                await reportResponse.json();


            if (
                !businessResponse.ok ||
                !businessResult.success
            ) {
                throw new Error(
                    businessResult.message ||
                    "Gagal mengambil data bisnis"
                );
            }


            if (
                !reportResponse.ok ||
                !reportResult.success
            ) {
                throw new Error(
                    reportResult.message ||
                    "Gagal mengambil laporan"
                );
            }


            const businesses =
                businessResult.data || [];

            const reports =
                reportResult.data || {};


            // ===============================
            // HITUNG STATISTIK
            // ===============================

            const pending =
                businesses.filter(
                    business =>
                        business.verification_status === "pending"
                ).length;


            const active =
                businesses.filter(
                    business =>
                        business.verification_status === "approved"
                ).length;


            totalBusiness.textContent =
                reports.total_businesses ?? businesses.length;

            pendingBusiness.textContent =
                pending;

            activeBusiness.textContent =
                active;

            totalOwner.textContent =
                reports.total_owners ?? 0;


            // ===============================
            // KOSONG
            // ===============================

            if (businesses.length === 0) {

                businessTable.innerHTML = `
                    <div class="admin-empty">

                        <div class="admin-empty-icon">
                            <i class="fa-solid fa-store"></i>
                        </div>

                        <h4>
                            Belum ada bisnis
                        </h4>

                        <p>
                            Belum ada bisnis yang terdaftar di sistem SPC.
                        </p>

                    </div>
                `;

                return;
            }


            // ===============================
            // TAMPILKAN BISNIS
            // ===============================

            businessTable.innerHTML = "";


            businesses.forEach(business => {

                const item =
                    document.createElement("div");

                item.className =
                    "admin-business-item";


                let statusText =
                    "Menunggu Verifikasi";

                let statusClass =
                    "pending";


                if (
                    business.verification_status ===
                    "approved"
                ) {

                    statusText =
                        "Aktif";

                    statusClass =
                        "approved";

                }


                item.innerHTML = `

                    <div class="business-main-info">

                        <div class="business-icon">
                            <i class="fa-solid fa-store"></i>
                        </div>

                        <div class="business-details">

                            <h4>
                                ${escapeHTML(
                                    business.business_name || "-"
                                )}
                            </h4>

                            <p>
                                <i class="fa-solid fa-user"></i>
                                ${escapeHTML(
                                    business.owner_name || "-"
                                )}
                            </p>

                            <p>
                                <i class="fa-solid fa-tag"></i>
                                ${escapeHTML(
                                    business.category || "-"
                                )}
                            </p>

                        </div>

                    </div>


                    <div class="business-contact">

                        <p>
                            <i class="fa-solid fa-envelope"></i>
                            ${escapeHTML(
                                business.owner_email ||
                                business.email ||
                                "-"
                            )}
                        </p>

                        <p>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(
                                business.address || "-"
                            )}
                        </p>

                    </div>


                    <div class="business-status-info">

                        <span class="business-status ${statusClass}">
                            ${statusText}
                        </span>

                        <a
                            href="verifikasi-bisnis.html"
                            class="business-view-button"
                        >
                            Lihat Detail
                        </a>

                    </div>

                `;


                businessTable.appendChild(item);

            });


        } catch (error) {

            console.error(
                "ADMIN BISNIS ERROR:",
                error
            );


            businessTable.innerHTML = `

                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>

                    <h4>
                        Gagal memuat data
                    </h4>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Terjadi kesalahan saat mengambil data bisnis."
                        )}
                    </p>

                </div>

            `;

        }

    }


    // ===============================
    // AMANKAN TEXT DATABASE
    // ===============================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ===============================
    // JALANKAN
    // ===============================

    loadBusinesses();

});