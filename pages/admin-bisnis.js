document.addEventListener("DOMContentLoaded", () => {

    loadBusinesses();

    async function loadBusinesses() {

        const container = document.getElementById("businessTable");

        try {

            const response = await fetch(
                "http://localhost:3000/api/admin/businesses"
            );

            const result = await response.json();

            console.log("DATA BISNIS:", result);

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Gagal mengambil data bisnis"
                );
            }

            const businesses = result.data || [];


            // STATISTIK
            document.getElementById("totalBusiness").textContent =
                businesses.length;


            const pending = businesses.filter(
                business =>
                    business.verification_status === "pending"
            ).length;


            const active = businesses.filter(
                business =>
                    business.verification_status === "approved" ||
                    business.verification_status === "active"
            ).length;


            const owners = new Set(
                businesses
                    .map(business => business.owner_id)
                    .filter(Boolean)
            ).size;


            document.getElementById("pendingBusiness").textContent =
                pending;

            document.getElementById("activeBusiness").textContent =
                active;

            document.getElementById("totalOwner").textContent =
                owners;


            // KOSONG
            if (businesses.length === 0) {

                container.innerHTML = `
                    <div class="admin-empty">

                        <div class="admin-empty-icon">
                            <i class="fa-solid fa-store-slash"></i>
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


            // DATA BISNIS
            container.innerHTML = businesses.map(business => {

                let statusText = "Belum diverifikasi";

                if (
                    business.verification_status === "approved" ||
                    business.verification_status === "active"
                ) {
                    statusText = "Aktif";

                } else if (
                    business.verification_status === "pending"
                ) {
                    statusText = "Menunggu";

                } else if (
                    business.verification_status === "rejected"
                ) {
                    statusText = "Ditolak";
                }


                return `
                    <div class="admin-business-item">

                        <div class="admin-business-icon">
                            <i class="fa-solid fa-store"></i>
                        </div>

                        <div class="admin-business-info">

                            <strong>
                                ${escapeHTML(
                                    business.business_name || "-"
                                )}
                            </strong>

                            <span>
                                Pemilik:
                                ${escapeHTML(
                                    business.owner_name || "-"
                                )}
                            </span>

                            <small>
                                ${escapeHTML(
                                    business.category || "Tanpa kategori"
                                )}
                            </small>

                        </div>


                        <div class="admin-business-contact">

                            <span>
                                <i class="fa-solid fa-phone"></i>

                                ${escapeHTML(
                                    business.phone || "-"
                                )}
                            </span>

                            <span>
                                <i class="fa-solid fa-location-dot"></i>

                                ${escapeHTML(
                                    business.address || "-"
                                )}
                            </span>

                        </div>


                        <div class="admin-business-status">

                            <span>
                                ${statusText}
                            </span>

                        </div>

                    </div>
                `;

            }).join("");


        } catch (error) {

            console.error(
                "Gagal memuat bisnis:",
                error
            );

            container.innerHTML = `
                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>

                    <h4>
                        Gagal mengambil data
                    </h4>

                    <p>
                        Tidak dapat terhubung ke database bisnis SPC.
                    </p>

                </div>
            `;
        }
    }


    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            localStorage.removeItem("spc_token");
            localStorage.removeItem("spc_user");

            window.location.href = "../login.html";

        });

    }

});