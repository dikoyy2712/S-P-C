const API_URL = "";


        // ================================
        // OWNER INFO
        // ================================

        function loadOwnerInfo() {

            try {

                const user =
                    JSON.parse(
                        localStorage.getItem(
                            "spc_user"
                        ) || "null"
                    );

                if (!user) return;

                const name =
                    user.name ||
                    user.email ||
                    "Owner";

                document.getElementById(
                    "ownerName"
                ).textContent = name;

                document.getElementById(
                    "ownerAvatar"
                ).textContent =
                    name.charAt(0).toUpperCase();

            } catch (error) {

                console.error(
                    "Owner info error:",
                    error
                );

            }

        }


        // ================================
        // RUPIAH
        // ================================

        function formatRupiah(value) {

            return new Intl.NumberFormat(
                "id-ID",
                {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0
                }
            ).format(
                Number(value) || 0
            );

        }


        // ================================
        // LOAD STATISTICS
        // ================================

        async function loadStatistics() {

            const token =
                localStorage.getItem(
                    "spc_token"
                );


            if (!token) {

                window.location.href =
                    "../login.html";

                return;

            }


            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/owner/statistics",
                        {
                            headers: {
                                "Authorization":
                                    "Bearer " +
                                    token
                            }
                        }
                    );


                if (response.status === 401) {

                    localStorage.removeItem(
                        "spc_token"
                    );

                    localStorage.removeItem(
                        "spc_user"
                    );

                    window.location.href =
                        "../login.html";

                    return;

                }


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Gagal mengambil statistik"
                    );

                }


                renderStatistics(
                    data.statistics
                );

            } catch (error) {

                console.error(
                    "Statistics error:",
                    error
                );

                document.getElementById(
                    "statisticsChart"
                ).innerHTML = `

                    <div class="statistics-error">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        Gagal memuat statistik

                        <br>

                        <small>
                            ${escapeHtml(error.message)}
                        </small>

                    </div>

                `;

            }

        }


        // ================================
        // RENDER
        // ================================

        function renderStatistics(stats) {

            document.getElementById(
                "totalOrders"
            ).textContent =
                Number(
                    stats.totalOrders || 0
                );


            document.getElementById(
                "revenue"
            ).textContent =
                formatRupiah(
                    stats.revenue
                );


            document.getElementById(
                "completedTop"
            ).textContent =
                Number(
                    stats.completed || 0
                );


            document.getElementById(
                "activeProducts"
            ).textContent =
                Number(
                    stats.activeProducts || 0
                );


            document.getElementById(
                "pending"
            ).textContent =
                Number(
                    stats.pending || 0
                );


            document.getElementById(
                "processing"
            ).textContent =
                Number(
                    stats.processing || 0
                );


            document.getElementById(
                "completed"
            ).textContent =
                Number(
                    stats.completed || 0
                );


            renderChart(
                stats.dailyOrders || []
            );

        }


        // ================================
        // CHART
        // ================================

        function renderChart(data) {

            const chart =
                document.getElementById(
                    "statisticsChart"
                );


            const days = [];


            for (let i = 6; i >= 0; i--) {

                const date =
                    new Date();

                date.setHours(
                    0,
                    0,
                    0,
                    0
                );

                date.setDate(
                    date.getDate() - i
                );


                const key =
                    date
                        .toISOString()
                        .split("T")[0];


                const found =
                    data.find(
                        item =>
                            String(
                                item.order_date
                            ).slice(0, 10) === key
                    );


                days.push({
                    date,
                    total: found
                        ? Number(found.total)
                        : 0
                });

            }


            const max =
                Math.max(
                    ...days.map(
                        day =>
                            day.total
                    ),
                    1
                );


            chart.innerHTML =
                days.map(day => {

                    const label =
                        day.date.toLocaleDateString(
                            "id-ID",
                            {
                                weekday: "short"
                            }
                        ).replace(
                            ".",
                            ""
                        );


                    const height =
                        day.total === 0
                            ? 4
                            : Math.max(
                                8,
                                (
                                    day.total /
                                    max
                                ) * 100
                            );


                    return `

                        <div class="chart-day">

                            <span class="chart-value">
                                ${day.total}
                            </span>

                            <div class="chart-bar-area">

                                <div
                                    class="chart-bar"
                                    style="height:${height}%"
                                ></div>

                            </div>

                            <span class="chart-label">
                                ${escapeHtml(label)}
                            </span>

                        </div>

                    `;

                }).join("");

        }


        // ================================
        // ESCAPE
        // ================================

        function escapeHtml(value) {

            return String(
                value ?? ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        // ================================
        // START
        // ================================

        loadOwnerInfo();

        loadStatistics();