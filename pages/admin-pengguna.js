document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});


async function loadUsers() {

    const table = document.getElementById("userTable");

    try {

        const response = await fetch(
            "http://localhost:3000/api/admin/users"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Gagal mengambil data pengguna"
            );
        }

        const users = result.data;

        document.getElementById("totalUsers").textContent =
            users.length;

        document.getElementById("totalOwners").textContent =
            users.filter(
                user => user.role === "owner"
            ).length;

        document.getElementById("totalCustomers").textContent =
            users.filter(
                user => user.role === "customer"
            ).length;

        document.getElementById("totalActive").textContent =
            users.filter(
                user => user.status === "active"
            ).length;


        if (users.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        Belum ada pengguna.
                    </td>
                </tr>
            `;

            return;
        }


        table.innerHTML = users.map(user => {

            let actionHTML = "-";

            if (user.status === "pending") {

                actionHTML = `
                    <button
                        class="approve-user-btn"
                        onclick="approveUser(${user.id})">
                        <i class="fa-solid fa-check"></i>
                        Approve
                    </button>
                `;

            } else if (user.status === "active") {

                actionHTML = `
                    <span class="action-active">
                        <i class="fa-solid fa-circle-check"></i>
                        Aktif
                    </span>
                `;

            }


            return `
                <tr>

                    <td>#${user.id}</td>

                    <td>
                        <strong>
                            ${escapeHTML(user.name)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(user.email)}
                    </td>

                    <td>
                        <span class="user-role ${user.role}">
                            ${escapeHTML(user.role)}
                        </span>
                    </td>

                    <td>
                        <span class="user-status ${user.status}">
                            ${escapeHTML(user.status)}
                        </span>
                    </td>

                    <td>
                        ${formatDate(user.created_at)}
                    </td>

                    <td>
                        ${actionHTML}
                    </td>

                </tr>
            `;

        }).join("");


    } catch (error) {

        console.error(
            "Gagal memuat pengguna:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Gagal mengambil data pengguna.
                </td>
            </tr>
        `;
    }
}


/* =========================
   APPROVE USER
========================= */

async function approveUser(userId) {

    const button =
        event.currentTarget;

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Memproses...
    `;


    try {

        const response = await fetch(
            `http://localhost:3000/api/admin/users/${userId}/approve`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Gagal mengaktifkan pengguna"
            );

        }


        alert("Pengguna berhasil diaktifkan.");

        loadUsers();


    } catch (error) {

        console.error(
            "Gagal approve pengguna:",
            error
        );

        alert(
            error.message ||
            "Gagal mengaktifkan pengguna."
        );

        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Approve
        `;
    }
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}