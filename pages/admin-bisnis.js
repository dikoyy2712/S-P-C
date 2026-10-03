document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }


    const businessTable =
        document.getElementById("businessTable");

    const businessSearch =
        document.getElementById("businessSearch");

    const businessFilter =
        document.getElementById("businessFilter");

    const businessCount =
        document.getElementById("businessCount");


    let businesses = [];


    // ===============================
    // LOAD DATA
    // ===============================

    async function loadBusinesses() {

        try {

            const response =
                await fetch("/api/admin/businesses");


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Gagal mengambil data bisnis"
                );
            }


            businesses =
                result.data || [];


            renderBusinesses();


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


            businessCount.textContent =
                "Gagal memuat";

        }

    }


    // ===============================
    // RENDER BISNIS
    // ===============================

    function renderBusinesses() {

        const search =
            businessSearch.value
                .trim()
                .toLowerCase();


        const filter =
            businessFilter.value;


        const filtered =
            businesses.filter(business => {

                const businessName =
                    String(
                        business.business_name || ""
                    ).toLowerCase();


                const ownerName =
                    String(
                        business.owner_name || ""
                    ).toLowerCase();


                const matchesSearch =
                    businessName.includes(search) ||
                    ownerName.includes(search);


                const matchesFilter =
                    filter === "all" ||
                    business.verification_status === filter;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            });


        // ===============================
        // JUMLAH
        // ===============================

        businessCount.textContent =
            `${filtered.length} Bisnis`;


        // ===============================
        // KOSONG
        // ===============================

        if (filtered.length === 0) {

            businessTable.innerHTML = `

                <div class="admin-empty">

                    <div class="admin-empty-icon">

                        <i class="fa-solid fa-store-slash"></i>

                    </div>

                    <h4>
                        Bisnis tidak ditemukan
                    </h4>

                    <p>
                        Tidak ada bisnis yang sesuai dengan pencarian atau filter.
                    </p>

                </div>

            `;

            return;

        }


        // ===============================
        // TAMPILKAN DATA
        // ===============================

        businessTable.innerHTML = "";


        filtered.forEach(business => {

            const item =
                document.createElement("div");


            item.className =
                "admin-business-item";


            const approved =
                business.verification_status ===
                "approved";


            const statusText =
                approved
                    ? "Aktif"
                    : "Menunggu";


            const statusClass =
                approved
                    ? "approved"
                    : "pending";


            item.innerHTML = `

                <!-- BISNIS -->

                <div class="admin-business-cell business-main-info">

                    <div class="business-icon">

                        <i class="fa-solid fa-store"></i>

                    </div>

                    <div class="business-details">

                        <strong>
                            ${escapeHTML(
                                business.business_name || "-"
                            )}
                        </strong>

                        <span>
                            ID Bisnis #${escapeHTML(
                                business.id || "-"
                            )}
                        </span>

                    </div>

                </div>


                <!-- OWNER -->

                <div class="admin-business-cell business-owner-info">

                    <strong>
                        ${escapeHTML(
                            business.owner_name || "-"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            business.owner_email || "-"
                        )}
                    </span>

                </div>


                <!-- KATEGORI -->

                <div class="admin-business-cell business-category">

                    <span>
                        ${escapeHTML(
                            business.category || "-"
                        )}
                    </span>

                </div>


                <!-- KONTAK -->

                <div class="admin-business-cell business-contact">

                    <span>
                        ${
                            business.phone
                                ? `<i class="fa-solid fa-phone"></i>
                                   ${escapeHTML(business.phone)}`
                                : `<i class="fa-solid fa-location-dot"></i>
                                   ${escapeHTML(
                                       business.address || "-"
                                   )}`
                        }
                    </span>

                </div>


                <!-- STATUS -->

                <div class="admin-business-cell business-status-info">

                    <span class="business-status ${statusClass}">
                        ${statusText}
                    </span>

                </div>

            `;


            businessTable.appendChild(item);

        });

    }


    // ===============================
    // SEARCH
    // ===============================

    businessSearch.addEventListener(
        "input",
        renderBusinesses
    );


    // ===============================
    // FILTER
    // ===============================

    businessFilter.addEventListener(
        "change",
        renderBusinesses
    );


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


    // ===============================
    // START
    // ===============================

    loadBusinesses();

});