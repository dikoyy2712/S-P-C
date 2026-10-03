document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("spc_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    const totalUsers =
        document.getElementById("totalUsers");

    const totalOwners =
        document.getElementById("totalOwners");

    const totalCustomers =
        document.getElementById("totalCustomers");

    const totalActive =
        document.getElementById("totalActive");

    const userTable =
        document.getElementById("userTable");


    // ===============================
    // LOAD USERS
    // ===============================

    async function loadUsers() {

        try {

            userTable.innerHTML = `
                <tr>
                    <td colspan="7">
                        Memuat data pengguna...
                    </td>
                </tr>
            `;


            const response = await fetch(
                "/api/admin/users"
            );

            const result = await response.json();


            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Gagal mengambil data pengguna"
                );
            }


            const users =
                result.data || [];


            // ===============================
            // STATISTIK
            // ===============================

            const owners =
                users.filter(
                    user => user.role === "owner"
                ).length;


            const customers =
                users.filter(
                    user => user.role === "customer"
                ).length;


            const active =
                users.filter(
                    user => user.status === "active"
                ).length;


            totalUsers.textContent =
                users.length;

            totalOwners.textContent =
                owners;

            totalCustomers.textContent =
                customers;

            totalActive.textContent =
                active;


            // ===============================
            // KOSONG
            // ===============================

            if (users.length === 0) {

                userTable.innerHTML = `
                    <tr>
                        <td colspan="7">
                            Belum ada pengguna.
                        </td>
                    </tr>
                `;

                return;
            }


            // ===============================
            // TABEL
            // ===============================

            userTable.innerHTML = "";


            users.forEach(user => {

                const row =
                    document.createElement("tr");


                const roleText =
                    user.role === "owner"
                        ? "Owner"
                        : user.role === "customer"
                            ? "Customer"
                            : user.role || "-";


                const roleClass =
                    user.role === "owner"
                        ? "owner"
                        : "customer";


                const isActive =
                    user.status === "active";


                const statusText =
                    isActive
                        ? "Aktif"
                        : "Menunggu";


                const statusClass =
                    isActive
                        ? "active"
                        : "pending";


                const createdDate =
                    user.created_at
                        ? new Date(
                            user.created_at
                        ).toLocaleDateString(
                            "id-ID",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                            }
                        )
                        : "-";


                row.innerHTML = `

                    <td>
                        ${escapeHTML(user.id)}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                user.name || "-"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            user.email || "-"
                        )}
                    </td>

                    <td>
                        <span class="user-role ${roleClass}">
                            ${escapeHTML(roleText)}
                        </span>
                    </td>

                    <td>
                        <span class="user-status ${statusClass}">
                            ${statusText}
                        </span>
                    </td>

                    <td>
                        ${createdDate}
                    </td>

                    <td class="user-action-cell">

                        ${
                            isActive
                                ? `
                                    <span class="user-action-done">
                                        <i class="fa-solid fa-check"></i>
                                        Aktif
                                    </span>
                                  `
                                : `
                                    <button
                                        type="button"
                                        class="user-approve-button"
                                        data-id="${escapeHTML(user.id)}"
                                    >
                                        <i class="fa-solid fa-check"></i>
                                        Setujui
                                    </button>
                                  `
                        }

                    </td>

                `;


                userTable.appendChild(row);

            });


            // ===============================
            // TOMBOL APPROVE
            // ===============================

            document
                .querySelectorAll(".user-approve-button")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const userId =
                                button.dataset.id;


                            const yakin =
                                confirm(
                                    "Setujui akun pengguna ini?"
                                );


                            if (!yakin) {
                                return;
                            }


                            try {

                                button.disabled = true;

                                button.innerHTML = `
                                    <i class="fa-solid fa-spinner fa-spin"></i>
                                    Memproses...
                                `;


                                const response =
                                    await fetch(
                                        `/api/admin/users/${userId}/approve`,
                                        {
                                            method: "PATCH",
                                            headers: {
                                                Authorization:
                                                    `Bearer ${token}`
                                            }
                                        }
                                    );


                                const result =
                                    await response.json();


                                if (
                                    !response.ok ||
                                    !result.success
                                ) {
                                    throw new Error(
                                        result.message ||
                                        "Gagal menyetujui pengguna"
                                    );
                                }


                                await loadUsers();


                            } catch (error) {

                                console.error(
                                    "APPROVE USER ERROR:",
                                    error
                                );

                                alert(
                                    error.message ||
                                    "Gagal menyetujui pengguna."
                                );

                                button.disabled = false;

                                button.innerHTML = `
                                    <i class="fa-solid fa-check"></i>
                                    Setujui
                                `;

                            }

                        }
                    );

                });


        } catch (error) {

            console.error(
                "ADMIN PENGGUNA ERROR:",
                error
            );


            userTable.innerHTML = `
                <tr>
                    <td colspan="7">
                        Gagal memuat data pengguna.
                        ${escapeHTML(
                            error.message || ""
                        )}
                    </td>
                </tr>
            `;

        }

    }


    // ===============================
    // ESCAPE HTML
    // ===============================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    loadUsers();

});