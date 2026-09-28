document.addEventListener("DOMContentLoaded", () => {
    loadReports();
});


async function loadReports() {

    try {

        const response = await fetch(
            "http://localhost:3000/api/admin/reports"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Gagal mengambil laporan"
            );
        }

        const data = result.data;

        // Total Bisnis
        document.getElementById("totalBusiness")
            .textContent = data.total_businesses;

        // Total Pengguna
        document.getElementById("totalUsers")
            .textContent = data.total_users;

        // Total Pesanan
        document.getElementById("totalOrders")
            .textContent = data.total_orders;

        // Total Pendapatan
        document.getElementById("totalRevenue")
            .textContent = formatRupiah(
                data.total_revenue
            );

        // Total Owner
        document.getElementById("totalOwners")
            .textContent = data.total_owners;

        // Total Customer
        document.getElementById("totalCustomers")
            .textContent = data.total_customers;


    } catch (error) {

        console.error(
            "Gagal memuat laporan:",
            error
        );

    }

}


function formatRupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(value);

}