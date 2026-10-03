document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }


    // ===============================
    // ELEMENT
    // ===============================

    const totalBusiness =
        document.getElementById("totalBusiness");

    const totalUsers =
        document.getElementById("totalUsers");

    const totalOrders =
        document.getElementById("totalOrders");

    const totalRevenue =
        document.getElementById("totalRevenue");

    const totalOwners =
        document.getElementById("totalOwners");

    const totalCustomers =
        document.getElementById("totalCustomers");


    // ===============================
    // LOAD REPORT
    // ===============================

    async function loadReport() {

        try {

            const response =
                await fetch(
                    "/api/admin/reports"
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Gagal mengambil data laporan"
                );
            }


            const data =
                result.data || {};


            // ===============================
            // STATISTIK UTAMA
            // ===============================

            totalBusiness.textContent =
                formatNumber(
                    data.total_businesses
                );


            totalUsers.textContent =
                formatNumber(
                    data.total_users
                );


            totalOrders.textContent =
                formatNumber(
                    data.total_orders
                );


            totalRevenue.textContent =
                formatRupiah(
                    data.total_revenue
                );


            // ===============================
            // STATISTIK PENGGUNA
            // ===============================

            totalOwners.textContent =
                formatNumber(
                    data.total_owners
                );


            totalCustomers.textContent =
                formatNumber(
                    data.total_customers
                );


        } catch (error) {

            console.error(
                "ADMIN LAPORAN ERROR:",
                error
            );


            totalBusiness.textContent = "-";
            totalUsers.textContent = "-";
            totalOrders.textContent = "-";
            totalRevenue.textContent = "Rp -";
            totalOwners.textContent = "-";
            totalCustomers.textContent = "-";


            console.error(
                "Gagal memuat laporan:",
                error.message
            );

        }

    }


    // ===============================
    // FORMAT ANGKA
    // ===============================

    function formatNumber(value) {

        const number =
            Number(value) || 0;

        return number.toLocaleString("id-ID");

    }


    // ===============================
    // FORMAT RUPIAH
    // ===============================

    function formatRupiah(value) {

        const number =
            Number(value) || 0;

        return number.toLocaleString(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        );

    }


    // ===============================
    // JALANKAN
    // ===============================

    loadReport();

});