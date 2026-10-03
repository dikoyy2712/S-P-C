document.addEventListener("DOMContentLoaded", async () => {

    const token =
        localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }


    const verificationList =
        document.getElementById(
            "verificationList"
        );

    const activityList =
        document.getElementById(
            "activityList"
        );

    const recentBusinessList =
        document.getElementById(
            "recentBusinessList"
        );


    // ===============================
    // LOAD DATA
    // ===============================

    async function loadDashboard() {

        try {

            const [
                businessResponse,
                userResponse
            ] = await Promise.all([

                fetch("/api/admin/businesses"),

                fetch("/api/admin/users")

            ]);


            const businessResult =
                await businessResponse.json();

            const userResult =
                await userResponse.json();


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
                !userResponse.ok ||
                !userResult.success
            ) {
                throw new Error(
                    userResult.message ||
                    "Gagal mengambil data pengguna"
                );
            }


            const businesses =
                businessResult.data || [];

            const users =
                userResult.data || [];


            renderVerification(
                businesses
            );

            renderActivities(
                businesses,
                users
            );

            renderRecentBusinesses(
                businesses
            );


        } catch (error) {

            console.error(
                "ADMIN DASHBOARD ERROR:",
                error
            );


            showError(
                verificationList,
                "Gagal memuat verifikasi."
            );

            showError(
                activityList,
                "Gagal memuat aktivitas."
            );

            showError(
                recentBusinessList,
                "Gagal memuat bisnis."
            );

        }

    }


    // ===============================
    // VERIFIKASI
    // ===============================

    function renderVerification(
        businesses
    ) {

        const pending =
            businesses.filter(
                business =>
                    business.verification_status ===
                    "pending"
            );


        if (pending.length === 0) {

            verificationList.innerHTML = `

                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>

                    <h4>
                        Tidak ada verifikasi
                    </h4>

                    <p>
                        Semua bisnis sudah diproses.
                    </p>

                </div>

            `;

            return;
        }


        verificationList.innerHTML = "";


        pending
            .slice(0, 4)
            .forEach(business => {

                const item =
                    document.createElement("div");

                item.className =
                    "dashboard-verification-item";


                item.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHTML(
                                business.business_name || "-"
                            )}
                        </strong>

                        <span>
                            Owner:
                            ${escapeHTML(
                                business.owner_name || "-"
                            )}
                        </span>

                    </div>


                    <a href="verifikasi-bisnis.html">
                        Lihat
                    </a>

                `;


                verificationList.appendChild(
                    item
                );

            });

    }


    // ===============================
    // AKTIVITAS
    // ===============================

    function renderActivities(
        businesses,
        users
    ) {

        const activities = [];


        // Owner baru
        users
            .filter(
                user =>
                    user.role === "owner"
            )
            .forEach(user => {

                activities.push({
                    type: "user",
                    title:
                        "Owner baru terdaftar",
                    description:
                        user.name || user.email,
                    date:
                        user.created_at
                });

            });


        // Bisnis baru
        businesses.forEach(business => {

            activities.push({
                type: "business",
                title:
                    "Bisnis baru ditambahkan",
                description:
                    business.business_name || "-",
                date:
                    business.created_at
            });

        });


        activities.sort(
            (a, b) =>
                new Date(b.date || 0) -
                new Date(a.date || 0)
        );


        const latest =
            activities.slice(0, 6);


        if (latest.length === 0) {

            activityList.innerHTML = `

                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </div>

                    <h4>
                        Belum ada aktivitas
                    </h4>

                    <p>
                        Aktivitas sistem akan muncul di sini.
                    </p>

                </div>

            `;

            return;
        }


        activityList.innerHTML = "";


        latest.forEach(activity => {

            const item =
                document.createElement("div");

            item.className =
                "dashboard-activity-item";


            const icon =
                activity.type === "business"
                    ? "fa-store"
                    : "fa-user-plus";


            item.innerHTML = `

                <div class="dashboard-activity-icon">

                    <i class="fa-solid ${icon}"></i>

                </div>


                <div class="dashboard-activity-info">

                    <strong>
                        ${escapeHTML(
                            activity.title
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            activity.description
                        )}
                    </span>

                </div>


                <time>
                    ${formatDate(
                        activity.date
                    )}
                </time>

            `;


            activityList.appendChild(item);

        });

    }


    // ===============================
    // BISNIS TERBARU
    // ===============================

    function renderRecentBusinesses(
        businesses
    ) {

        const latest =
            [...businesses]
                .sort(
                    (a, b) =>
                        new Date(
                            b.created_at || 0
                        ) -
                        new Date(
                            a.created_at || 0
                        )
                )
                .slice(0, 5);


        if (latest.length === 0) {

            recentBusinessList.innerHTML = `

                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        <i class="fa-solid fa-store"></i>
                    </div>

                    <h4>
                        Belum ada bisnis
                    </h4>

                    <p>
                        Belum ada bisnis terdaftar.
                    </p>

                </div>

            `;

            return;
        }


        recentBusinessList.innerHTML = "";


        latest.forEach(
            business => {

                const item =
                    document.createElement("div");

                item.className =
                    "dashboard-business-item";


                const approved =
                    business.verification_status ===
                    "approved";


                item.innerHTML = `

                    <div class="dashboard-business-icon">

                        <i class="fa-solid fa-store"></i>

                    </div>


                    <div class="dashboard-business-info">

                        <strong>
                            ${escapeHTML(
                                business.business_name || "-"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                business.category || "-"
                            )}
                        </span>

                    </div>


                    <span class="dashboard-business-status ${approved ? "approved" : "pending"}">

                        ${approved
                            ? "Aktif"
                            : "Menunggu"}

                    </span>

                `;


                recentBusinessList.appendChild(
                    item
                );

            }
        );

    }


    // ===============================
    // ERROR
    // ===============================

    function showError(
        element,
        message
    ) {

        if (!element) return;


        element.innerHTML = `

            <div class="admin-empty">

                <div class="admin-empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h4>
                    Terjadi kesalahan
                </h4>

                <p>
                    ${escapeHTML(message)}
                </p>

            </div>

        `;

    }


    // ===============================
    // FORMAT TANGGAL
    // ===============================

    function formatDate(
        date
    ) {

        if (!date) {
            return "-";
        }


        return new Date(date)
            .toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

    }


    // ===============================
    // SECURITY
    // ===============================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    loadDashboard();

});