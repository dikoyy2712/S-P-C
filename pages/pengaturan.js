document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    const nameInput = document.querySelector('input[type="text"]');
    const emailInput = document.querySelector('input[type="email"]');
    const phoneInput = document.querySelector('input[type="tel"]');

    const saveButton = document.querySelector(".settings-save");
    const passwordButton = document.querySelector(".settings-button");

    const ownerName = document.querySelector(".owner-profile strong");
    const ownerAvatar = document.querySelector(".owner-avatar");

    // =========================
    // LOAD DATA AKUN
    // =========================
    async function loadAccount() {
        try {
            const response = await fetch("/api/owner/settings", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal mengambil data akun");
            }

            nameInput.value = result.data.name || "";
            emailInput.value = result.data.email || "";
            phoneInput.value = result.data.phone || "";

            ownerName.textContent = result.data.name || "Owner";
            ownerAvatar.textContent =
                (result.data.name || "O").charAt(0).toUpperCase();

        } catch (error) {
            console.error(error);
            alert("Gagal memuat informasi akun.");
        }
    }


    // =========================
    // SIMPAN PENGATURAN
    // =========================
    saveButton.addEventListener("click", async () => {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name) {
            alert("Nama pemilik tidak boleh kosong.");
            return;
        }

        try {
            saveButton.disabled = true;
            saveButton.textContent = "Menyimpan...";

            const response = await fetch("/api/owner/settings", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    phone
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal menyimpan pengaturan");
            }

            ownerName.textContent = name;
            ownerAvatar.textContent = name.charAt(0).toUpperCase();

            alert("Pengaturan berhasil disimpan.");

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            saveButton.disabled = false;

            saveButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Simpan Pengaturan';
        }
    });


    // =========================
    // UBAH PASSWORD
    // =========================
    passwordButton.addEventListener("click", async () => {

        const currentPassword = prompt("Masukkan password lama:");

        if (currentPassword === null) return;

        const newPassword = prompt("Masukkan password baru:");

        if (newPassword === null) return;

        if (newPassword.length < 6) {
            alert("Password baru minimal 6 karakter.");
            return;
        }

        try {
            const response = await fetch("/api/owner/password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal mengubah password");
            }

            alert("Password berhasil diubah.");

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });


    loadAccount();
});