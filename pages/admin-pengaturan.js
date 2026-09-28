document.addEventListener("DOMContentLoaded", () => {

    checkBackend();

});


async function checkBackend() {

    const status =
        document.getElementById("backendStatus");

    try {

        const response = await fetch(
            "http://localhost:3000/api/status"
        );

        const result =
            await response.json();


        if (result.success) {

            status.textContent =
                "Terhubung dan berjalan";

            status.classList.add(
                "system-online"
            );

        } else {

            status.textContent =
                "Backend tidak merespons";

        }

    } catch (error) {

        console.error(
            "Koneksi backend gagal:",
            error
        );

        status.textContent =
            "Tidak dapat terhubung ke backend";

        status.classList.add(
            "system-offline"
        );

    }

}