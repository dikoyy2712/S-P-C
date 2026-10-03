document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    const statCards =
        document.querySelectorAll(".owner-stat-card strong");

    const panels =
        document.querySelectorAll(".owner-panel");

    const verificationPanel = panels[0];

    const verificationEmpty =
        verificationPanel.querySelector(".admin-empty");


    // =========================
    // QUICK ACTION
    // =========================

    const quickActions =
        document.querySelectorAll(".quick-actions a");

    if (quickActions[2]) {
        quickActions[2].href = "admin-pengguna.html";
    }

    if (quickActions[3]) {
        quickActions[3].href = "admin-laporan.html";
    }


    // =========================
    // LOAD REPORTS
    // =========================

    async function loadReports() {

        const response = await fetch(
            "/api/admin/reports"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Gagal mengambil laporan admin"
            );
        }

        const data = result.data;

        // Total Bisnis
        statCards[0].textContent =
            data.total_businesses ?? 0;

        // Total Owner
        statCards[3].textContent =
            data.total_owners ?? 0;
    }


    // =========================
    // LOAD BISNIS
    // =========================

    async function loadBusinesses() {

        const response = await fetch(
            "/api/admin/businesses"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Gagal mengambil data bisnis"
            );
        }

        const businesses =
            result.data || [];


        // =========================
        // HITUNG STATUS
        // =========================

        const pendingBusinesses =
            businesses.filter(
                business =>
                    business.verification_status === "pending"
            );

        const approvedBusinesses =
            businesses.filter(
                business =>
                    business.verification_status === "approved"
            );


        // Menunggu Verifikasi
        statCards[1].textContent =
            pendingBusinesses.length;

        // Bisnis Aktif
        statCards[2].textContent =
            approvedBusinesses.length;


        // =========================
        // PANEL VERIFIKASI
        // =========================

        const oldList =
            verificationPanel.querySelector(
                ".dashboard-verification-list"
            );

        if (oldList) {
            oldList.remove();
        }


        // Tidak ada pending
        if (pendingBusinesses.length === 0) {

            verificationEmpty.style.display =
                "block";

            verificationEmpty.querySelector("h4").textContent =
                "Belum ada permintaan";

            verificationEmpty.querySelector("p").textContent =
                "Bisnis yang menunggu verifikasi akan muncul di sini.";

            return;
        }


        verificationEmpty.style.display =
            "none";


        // Buat daftar bisnis pending
        const list =
            document.createElement("div");

        list.className =
            "dashboard-verification-list";


        pendingBusinesses
            .slice(0, 5)
            .forEach(business => {

                const item =
                    document.createElement("div");

                item.className =
                    "verification-item";


                item.innerHTML = `
                    <div class="verification-info">

                        <div class="verification-icon">
                            <i class="fa-solid fa-store"></i>
                        </div>

                        <div>

                            <h4>
                                ${business.business_name || "-"}
                            </h4>

                            <p>
                                Owner:
                                ${business.owner_name || "-"}
                            </p>

                            <p>
                                Kategori:
                                ${business.category || "-"}
                            </p>

                        </div>

                    </div>

                    <div class="verification-actions">

                        <a
                            href="verifikasi-bisnis.html"
                            class="verify-button">

                            Lihat

                        </a>

                    </div>
                `;

                list.appendChild(item);

            });


        verificationPanel.appendChild(list);
    }


    // =========================
    // JALANKAN
    // =========================

    try {

        await Promise.all([
            loadReports(),
            loadBusinesses()
        ]);

    } catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

    }

});