document.addEventListener("DOMContentLoaded", async () => {

    const token =
        localStorage.getItem("spc_token");

    if (!token) {
        window.location.href =
            "../login.html";
        return;
    }


    const backendStatus =
        document.getElementById(
            "backendStatus"
        );


    // ===============================
    // CEK BACKEND
    // ===============================

    async function checkBackend() {

        try {

            backendStatus.textContent =
                "Memeriksa koneksi...";


            const response =
                await fetch(
                    "/api/status"
                );


            const result =
                await response.json();


            if (
                !response.ok
            ) {
                throw new Error(
                    "Backend tidak merespons"
                );
            }


            backendStatus.textContent =
                result.message ||
                "Backend SPC aktif";


        } catch (error) {

            console.error(
                "BACKEND STATUS ERROR:",
                error
            );


            backendStatus.textContent =
                "Backend tidak terhubung";

        }

    }


    checkBackend();

});