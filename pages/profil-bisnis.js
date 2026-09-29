document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("businessForm");
    const cancelButton = document.querySelector(".business-cancel");

    const token = localStorage.getItem("spc_token");
    const userData = localStorage.getItem("spc_user");

    if (!token || !userData) {
        alert("Sesi login tidak ditemukan. Silakan login kembali.");
        window.location.href = "../login.html";
        return;
    }

    const user = JSON.parse(userData);
    // Tampilkan nama akun yang sedang login
const ownerName = document.getElementById("ownerName");
const ownerAvatar = document.getElementById("ownerAvatar");

if (ownerName) {
    ownerName.textContent = user.name;
}

if (ownerAvatar) {
    ownerAvatar.textContent =
        user.name.charAt(0).toUpperCase();
}


    /* =========================================
       LOAD PROFIL BISNIS
    ========================================= */

    loadBusiness();


    async function loadBusiness() {

        try {

            const response = await fetch(
    "/api/owner/business",
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Gagal mengambil data bisnis"
                );
            }


            /* BELUM ADA BISNIS */

            if (!result.data) {
                console.log("Owner belum memiliki bisnis.");
                return;
            }


            /* =========================================
               ISI FORM DARI DATABASE
            ========================================= */

            const business = result.data;

            document.getElementById("businessName").value =
                business.name || "";

            document.getElementById("businessCategory").value =
                business.category || "kuliner";

            document.getElementById("businessAddress").value =
                business.address || "";

            document.getElementById("businessPhone").value =
                business.phone || "";

            document.getElementById("businessEmail").value =
                business.email || "";

            document.getElementById("openTime").value =
                business.open_time
                    ? business.open_time.substring(0, 5)
                    : "";

            document.getElementById("closeTime").value =
                business.close_time
                    ? business.close_time.substring(0, 5)
                    : "";

            document.getElementById("businessDescription").value =
                business.description || "";

            console.log(
                "Profil bisnis berhasil dimuat:",
                business
            );

        } catch (error) {

            console.error(
                "Gagal memuat profil bisnis:",
                error
            );

            alert(
                error.message ||
                "Gagal mengambil data profil bisnis."
            );
        }
    }


    /* =========================================
       SIMPAN PROFIL BISNIS
    ========================================= */

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const businessData = {

            name:
                document
                    .getElementById("businessName")
                    .value
                    .trim(),

            category:
                document
                    .getElementById("businessCategory")
                    .value,

            address:
                document
                    .getElementById("businessAddress")
                    .value
                    .trim(),

            phone:
                document
                    .getElementById("businessPhone")
                    .value
                    .trim(),

            email:
                document
                    .getElementById("businessEmail")
                    .value
                    .trim(),

            open_time:
                document
                    .getElementById("openTime")
                    .value || null,

            close_time:
                document
                    .getElementById("closeTime")
                    .value || null,

            description:
                document
                    .getElementById("businessDescription")
                    .value
                    .trim()
        };


        /* =========================================
           VALIDASI
        ========================================= */

        if (!businessData.name) {
            alert("Nama bisnis wajib diisi.");
            return;
        }

        if (!businessData.category) {
            alert("Kategori bisnis wajib dipilih.");
            return;
        }

        if (!businessData.address) {
            alert("Alamat bisnis wajib diisi.");
            return;
        }

        try {

            const response = await fetch(
    "/api/owner/business",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },

                    body: JSON.stringify(businessData)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Gagal menyimpan profil bisnis"
                );
            }

            alert(
                result.message ||
                "Profil bisnis berhasil disimpan."
            );


            /* SIMPAN DATA TERBARU KE LOCAL STORAGE */

            if (result.data) {
                console.log(
                    "Data bisnis tersimpan:",
                    result.data
                );
            }


            /* TIDAK LANGSUNG PINDAH HALAMAN */

            await loadBusiness();

        } catch (error) {

            console.error(
                "Gagal menyimpan profil bisnis:",
                error
            );

            alert(
                error.message ||
                "Gagal menyimpan profil bisnis."
            );
        }

    });


    /* =========================================
       TOMBOL BATAL
    ========================================= */

    cancelButton.addEventListener("click", function () {

        loadBusiness();

    });

});