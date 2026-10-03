document.addEventListener("DOMContentLoaded", async function () {

    const token =
        localStorage.getItem("spc_token");

    const qrContainer =
        document.getElementById("qrcode");

    const qrStatus =
        document.getElementById("qr-status");

    const qrDescription =
        document.getElementById("qr-description");

    const ownerName =
        document.getElementById("ownerName");

    const ownerAvatar =
        document.getElementById("ownerAvatar");


    // ================================
    // CEK LOGIN
    // ================================

    if (!token) {
        window.location.href = "../login.html";
        return;
    }


    // ================================
    // OWNER INFO
    // ================================

    try {

        const user =
            JSON.parse(
                localStorage.getItem("spc_user") || "null"
            );

        if (user) {

            const name =
                user.name ||
                user.email ||
                "Owner";

            if (ownerName) {
                ownerName.textContent = name;
            }

            if (ownerAvatar) {
                ownerAvatar.textContent =
                    name.charAt(0).toUpperCase();
            }

        }

    } catch (error) {

        console.error(
            "Owner info error:",
            error
        );

    }


    // ================================
    // LOAD BUSINESS
    // ================================

    try {

        const response =
            await fetch(
                "/api/owner/business",
                {
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem("spc_token");
            localStorage.removeItem("spc_user");

            window.location.href =
                "../login.html";

            return;
        }


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Gagal mengambil data bisnis"
            );

        }


        const business =
            result.data;


        // ================================
        // BISNIS BELUM ADA
        // ================================

        if (!business) {

            qrStatus.textContent =
                "Bisnis belum tersedia";

            qrDescription.textContent =
                "Silakan lengkapi Profil Bisnis terlebih dahulu.";

            return;
        }


        // ================================
        // CEK VERIFIKASI
        // ================================

        if (
            business.verification_status !==
            "approved"
        ) {

            qrStatus.textContent =
                "QR Code belum tersedia";

            qrDescription.textContent =
                "QR Code akan tersedia setelah bisnis Anda disetujui Admin SPC.";

            return;
        }


        // ================================
        // URL CUSTOMER
        // ================================

        /*
         * Menggunakan domain website SPC yang sedang dibuka.
         *
         * Kalau dibuka dari Hostless:
         * https://domain-spc-kamu/pages/...
         *
         * Kalau dibuka lokal:
         * http://localhost:3000/pages/...
         */

        const customerUrl =
            new URL(
                "/pages/customer.html?business=" +
                encodeURIComponent(business.id),
                window.location.origin
            ).href;


        console.log(
            "Customer URL:",
            customerUrl
        );


        // ================================
        // BUAT QR CODE
        // ================================

        const qrImage =
            document.createElement("img");


        qrImage.src =
            "https://quickchart.io/qr?text=" +
            encodeURIComponent(customerUrl) +
            "&size=220";


        qrImage.width = 220;
        qrImage.height = 220;

        qrImage.alt =
            "QR Code " +
            (business.name || "Bisnis SPC");


        qrImage.loading = "eager";


        qrImage.onerror = function () {

            qrStatus.textContent =
                "Gagal membuat QR Code";

            qrDescription.textContent =
                "QR Code tidak dapat dimuat. Periksa koneksi internet.";

        };


        qrContainer.innerHTML = "";

        qrContainer.appendChild(qrImage);


        // ================================
        // STATUS
        // ================================

        qrStatus.textContent =
            "QR Code siap digunakan";


        qrDescription.textContent =
            "Scan QR Code ini untuk membuka halaman " +
            business.name + ".";


        // ================================
        // TAMPILKAN URL
        // ================================

        const urlElement =
            document.createElement("small");


        urlElement.textContent =
            customerUrl;


        urlElement.style.display =
            "block";

        urlElement.style.marginTop =
            "15px";

        urlElement.style.wordBreak =
            "break-all";

        urlElement.style.opacity =
            "0.7";


        qrDescription.after(
            urlElement
        );


    } catch (error) {

        console.error(
            "QR Code error:",
            error
        );


        qrStatus.textContent =
            "Gagal memuat QR Code";


        qrDescription.textContent =
            error.message ||
            "Gagal mengambil data bisnis.";

    }

});