document.addEventListener("DOMContentLoaded", () => {

    const password =
        document.getElementById("password");

    const toggle =
        document.getElementById("togglePassword");

    const loginForm =
        document.getElementById("loginForm");


    /* =========================================
       SHOW / HIDE PASSWORD
    ========================================= */

    toggle.addEventListener("click", () => {

        const isPassword =
            password.type === "password";

        password.type =
            isPassword
                ? "text"
                : "password";

        toggle.innerHTML =
            isPassword
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

    });


    /* =========================================
       LOGIN OWNER
    ========================================= */

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const passwordValue =
                password.value;


            /* CEK INPUT */

            if (
                email === "" ||
                passwordValue === ""
            ) {

                alert(
                    "Email dan password wajib diisi."
                );

                return;
            }


            /* =========================================
               KIRIM LOGIN KE BACKEND
            ========================================= */

            try {
                const response =
                    await fetch(
    "/api/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: passwordValue
                            })
                        }
                    );


                const result =
                    await response.json();


                /* LOGIN GAGAL */

                if (!response.ok) {

                    alert(
                        result.message ||
                        "Login gagal."
                    );

                    return;
                }


                /* =========================================
                   LOGIN BERHASIL
                ========================================= */

                // Hapus sesi lama
localStorage.removeItem("spc_token");
localStorage.removeItem("spc_user");

// Simpan sesi login baru
localStorage.setItem(
    "spc_token",
    result.token
);

localStorage.setItem(
    "spc_user",
    JSON.stringify(result.user)
);


                /* =========================================
   ARAHKAN SESUAI ROLE
========================================= */

if (result.user.role === "owner") {

    alert(
        "Login berhasil. Selamat datang di Dashboard Owner SPC."
    );

    window.location.href =
        "pages/dashboard.html";

} else if (result.user.role === "admin") {

    alert(
        "Login berhasil. Selamat datang di Dashboard Admin SPC."
    );

    window.location.href =
        "pages/admin-dashboard.html";

} else if (result.user.role === "customer") {

    alert(
        "Login berhasil. Selamat datang di SPC."
    );

    window.location.href =
        "pages/customer.html";

} else {

    alert(
        "Role pengguna tidak dikenali."
    );

}

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Tidak dapat terhubung ke server SPC."
                );

            }

        }
    );

});