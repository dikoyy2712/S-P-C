document.addEventListener("DOMContentLoaded", () => {

    const panel = document.querySelector(".verification-panel");
    const emptyState = panel.querySelector(".admin-empty");
    const statCards = document.querySelectorAll(".owner-stat-card strong");

    async function loadBusinesses() {

        try {

            const response = await fetch("/api/admin/businesses");

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Gagal mengambil data bisnis"
                );
            }

            const businesses = result.data || [];

            // =========================
            // STATISTIK
            // =========================

            const waiting = businesses.filter(
                business =>
                    business.verification_status === "pending"
            ).length;

            const approved = businesses.filter(
                business =>
                    business.verification_status === "approved"
            ).length;

            const rejected = businesses.filter(
                business =>
                    business.verification_status === "rejected"
            ).length;

            const active = approved;

            statCards[0].textContent = waiting;
            statCards[1].textContent = approved;
            statCards[2].textContent = rejected;
            statCards[3].textContent = active;


            // =========================
            // BISNIS PENDING
            // =========================

            const pendingBusinesses = businesses.filter(
                business =>
                    business.verification_status === "pending"
            );


            const oldList =
                panel.querySelector(".verification-list");

            if (oldList) {
                oldList.remove();
            }


            if (pendingBusinesses.length === 0) {

                emptyState.style.display = "block";

                emptyState.querySelector("h4").textContent =
                    "Belum ada pengajuan bisnis";

                emptyState.querySelector("p").textContent =
                    "Pengajuan bisnis dari Owner akan muncul di halaman ini.";

                return;
            }


            emptyState.style.display = "none";


            // =========================
            // DAFTAR BISNIS
            // =========================

            const list = document.createElement("div");

            list.className = "verification-list";


            pendingBusinesses.forEach(business => {

                const item = document.createElement("div");

                item.className = "verification-item";

                item.innerHTML = `
                    <div class="verification-info">

                        <div class="verification-icon">
                            <i class="fa-solid fa-store"></i>
                        </div>

                        <div>
                            <h4>${business.business_name || "-"}</h4>

                            <p>
                                Owner: ${business.owner_name || "-"}
                            </p>

                            <p>
                                Email: ${business.owner_email || "-"}
                            </p>

                            <p>
                                Kategori: ${business.category || "-"}
                            </p>

                            <p>
                                Alamat: ${business.address || "-"}
                            </p>

                        </div>

                    </div>

                    <div class="verification-actions">

                        <button
                            type="button"
                            class="verify-button"
                            data-id="${business.id}">

                            <i class="fa-solid fa-check"></i>
                            Verifikasi

                        </button>

                    </div>
                `;

                list.appendChild(item);

            });


            panel.appendChild(list);


            // =========================
            // TOMBOL VERIFIKASI
            // =========================

            document
                .querySelectorAll(".verify-button")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async function () {

                            const businessId =
                                this.dataset.id;

                            this.disabled = true;

                            this.innerHTML =
                                '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';


                            try {

                                const response = await fetch(
                                    `/api/admin/businesses/${businessId}/approve`,
                                    {
                                        method: "PATCH"
                                    }
                                );

                                const result =
                                    await response.json();


                                if (!response.ok) {

                                    throw new Error(
                                        result.message ||
                                        "Gagal memverifikasi bisnis"
                                    );

                                }


                                alert(
                                    "Bisnis berhasil diverifikasi."
                                );

                                await loadBusinesses();


                            } catch (error) {

                                console.error(
                                    "VERIFY ERROR:",
                                    error
                                );

                                alert(
                                    error.message ||
                                    "Terjadi kesalahan saat verifikasi."
                                );

                                this.disabled = false;

                                this.innerHTML =
                                    '<i class="fa-solid fa-check"></i> Verifikasi';

                            }

                        }
                    );

                });


        } catch (error) {

            console.error(
                "GET BUSINESSES ERROR:",
                error
            );

            emptyState.style.display = "block";

            emptyState.querySelector("h4").textContent =
                "Gagal memuat data";

            emptyState.querySelector("p").textContent =
                error.message ||
                "Gagal mengambil data bisnis dari server.";

        }

    }


    loadBusinesses();

});