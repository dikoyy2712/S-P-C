document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch(
            "http:///api/admin/users"
        );

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const users = result.data;

        // =========================
        // HITUNG DATA
        // =========================

        const totalOwners = users.filter(
            user => user.role === "owner"
        ).length;

        const pendingUsers = users.filter(
            user =>
                user.role === "owner" &&
                user.status === "pending"
        ).length;

        // =========================
        // STATISTIK DASHBOARD
        // =========================

        const statCards =
            document.querySelectorAll(".owner-stat-card");

        if (statCards.length >= 4) {

            // Total Bisnis
            // Untuk sementara ambil dari API bisnis
            try {

                const businessResponse = await fetch(
                    "http:///api/admin/businesses"
                );

                const businessResult =
                    await businessResponse.json();

                if (businessResult.success) {

                    const businesses =
                        businessResult.data;

                    statCards[0]
                        .querySelector("strong")
                        .textContent =
                        businesses.length;

                    // Menunggu verifikasi BISNIS
                    const pendingBusinesses =
                        businesses.filter(
                            business =>
                                business.verification_status === "pending"
                        ).length;

                    statCards[1]
                        .querySelector("strong")
                        .textContent =
                        pendingBusinesses;

                    // Bisnis aktif
                    const activeBusinesses =
                        businesses.filter(
                            business =>
                                business.verification_status === "approved"
                        ).length;

                    statCards[2]
                        .querySelector("strong")
                        .textContent =
                        activeBusinesses;
                }

            } catch (error) {

                console.error(
                    "Gagal mengambil data bisnis:",
                    error
                );
            }

            // Total Owner
            statCards[3]
                .querySelector("strong")
                .textContent =
                totalOwners;
        }

        // =========================
        // PERMINTAAN VERIFIKASI
        // =========================

        const verificationPanel =
            document.querySelector(".owner-grid .owner-panel");

        if (verificationPanel) {

            const emptyBox =
                verificationPanel.querySelector(".admin-empty");

            if (pendingUsers > 0 && emptyBox) {

                emptyBox.innerHTML = `
                    <div class="admin-empty-icon">
                        <i class="fa-solid fa-user-clock"></i>
                    </div>

                    <h4>
                        ${pendingUsers} akun menunggu verifikasi
                    </h4>

                    <p>
                        Terdapat akun Owner baru yang menunggu persetujuan Admin.
                    </p>

                    <a href="admin-pengguna.html"
                       style="
                           display:inline-block;
                           margin-top:12px;
                           color:#705cff;
                           font-weight:600;
                       ">
                        Verifikasi Pengguna
                    </a>
                `;
            }

        }

    } catch (error) {

        console.error(
            "Gagal memuat dashboard admin:",
            error
        );

    }

});