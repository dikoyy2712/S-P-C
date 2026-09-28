document.addEventListener("DOMContentLoaded", () => {

    const registerForm =
        document.getElementById("registerForm");

    const password =
        document.getElementById("password");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const togglePassword =
        document.getElementById("togglePassword");


    /* =========================================
       SHOW / HIDE PASSWORD
    ========================================= */

    togglePassword.addEventListener("click", () => {

        const isPassword =
            password.type === "password";

        password.type =
            isPassword
                ? "text"
                : "password";

        togglePassword.innerHTML =
            isPassword
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

    });


    /* =========================================
       REGISTER OWNER
    ========================================= */

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const business =
                document
                    .getElementById("business")
                    .value
                    .trim();


            /* CEK PASSWORD */

            if (
                password.value !==
                confirmPassword.value
            ) {

                alert(
                    "Password dan konfirmasi password tidak sama."
                );

                return;
            }


            /* KIRIM DATA KE BACKEND */

            try {

                const response =
                    await fetch(
                        "http://localhost:3000/api/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                business: business,
                                password: password.value
                            })
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.message ||
                        "Pendaftaran gagal."
                    );

                    return;
                }


                alert(
                    "Pendaftaran berhasil dikirim. Akun Anda menunggu verifikasi Admin SPC."
                );


                registerForm.reset();


            } catch (error) {

                console.error(
                    "Register error:",
                    error
                );

                alert(
                    "Tidak dapat terhubung ke server SPC."
                );

            }

        }
    );

});