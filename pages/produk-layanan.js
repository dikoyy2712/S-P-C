document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("productModal");
    const openButton = document.querySelector(".product-add-button");
    const closeButton = document.getElementById("closeProductModal");
    const cancelButton = document.getElementById("cancelProduct");
    const form = document.getElementById("productForm");
    const productList = document.querySelector(".product-list");

    const filterButton =
        document.getElementById("productFilterButton");

    const filterText =
        document.getElementById("productFilterText");

    const filterMenu =
        document.getElementById("productFilterMenu");

    const productName =
        document.getElementById("productName");

    const productCategory =
        document.getElementById("productCategory");

    const productPrice =
        document.getElementById("productPrice");

    const productStock =
        document.getElementById("productStock");

    const productDescription =
        document.getElementById("productDescription");

    const token =
        localStorage.getItem("spc_token");

    let editingProduct = null;
    let products = [];


    // =====================================================
    // CEK LOGIN
    // =====================================================

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

const user = JSON.parse(localStorage.getItem("spc_user"));

const ownerName = document.getElementById("ownerName");
const ownerAvatar = document.getElementById("ownerAvatar");

if (user) {
    if (ownerName) {
        ownerName.textContent = user.name;
    }

    if (ownerAvatar) {
        ownerAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
}
    // =====================================================
    // HELPER API
    // =====================================================

    async function apiRequest(url, options = {}) {

        const response = await fetch(
    url,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token,
                    ...(options.headers || {})
                }
            }
        );

        let result;

        try {
            result = await response.json();
        } catch {
            result = {
                success: false,
                message: "Respons server tidak valid."
            };
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Terjadi kesalahan pada server."
            );
        }

        return result;
    }


    // =====================================================
    // LOAD PRODUK
    // =====================================================

    async function loadProducts() {

        try {

            productList.innerHTML = `
                <div class="product-empty">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Memuat produk...</span>
                </div>
            `;

            const result =
                await apiRequest("/api/owner/products");

            products =
                Array.isArray(result.data)
                    ? result.data
                    : [];

            renderProducts();
            updateStatistics();

        } catch (error) {

            console.error(
                "Gagal memuat produk:",
                error
            );

            productList.innerHTML = `
                <div class="product-empty">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>${error.message}</span>
                </div>
            `;

        }

    }


    // =====================================================
    // FORMAT HARGA
    // =====================================================

    function formatPrice(price) {

        return new Intl.NumberFormat(
            "id-ID"
        ).format(Number(price) || 0);

    }


    // =====================================================
    // RENDER PRODUK
    // =====================================================

    function renderProducts() {

        productList.innerHTML = "";

        const selectedFilter =
            filterText.textContent;

        const filteredProducts =
            products.filter(product => {

                if (
                    selectedFilter === "Semua"
                ) {
                    return true;
                }

                return (
                    product.category ===
                    selectedFilter
                );

            });


        if (filteredProducts.length === 0) {

            productList.innerHTML = `
                <div class="product-empty">
                    <i class="fa-solid fa-box-open"></i>

                    <span>
                        Belum ada produk
                        ${selectedFilter !== "Semua"
                            ? "dalam kategori " +
                              selectedFilter
                            : ""
                        }.
                    </span>
                </div>
            `;

            return;
        }


        filteredProducts.forEach(product => {

            const productItem =
                document.createElement("div");

            productItem.className =
                "product-item";

            productItem.dataset.id =
                product.id;


            const stock =
                Number(product.stock) || 0;

            const status =
                product.status === "inactive"
                    ? "Nonaktif"
                    : stock <= 5
                        ? "Stok Rendah"
                        : "Aktif";

            const statusClass =
                product.status === "inactive"
                    ? "warning"
                    : stock <= 5
                        ? "warning"
                        : "active";


            productItem.innerHTML = `
                <div class="product-icon">
                    <i class="fa-solid fa-box"></i>
                </div>

                <div class="product-info">
                    <strong>
                        ${escapeHtml(product.name)}
                    </strong>

                    <span>
                        ${escapeHtml(product.category)}
                        • Stok ${stock}
                    </span>
                </div>

                <div class="product-price">
                    Rp ${formatPrice(product.price)}
                </div>

                <span class="product-status ${statusClass}">
                    ${status}
                </span>

                <button
                    class="product-more"
                    type="button"
                    data-id="${product.id}"
                >
                    <i class="fa-solid fa-ellipsis"></i>
                </button>
            `;


            productList.appendChild(
                productItem
            );

        });

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================================
    // STATISTIK
    // =====================================================

    function updateStatistics() {

        const totalProducts =
            products.length;

        const activeProducts =
            products.filter(product => {

                const stock =
                    Number(product.stock) || 0;

                return (
                    product.status !== "inactive" &&
                    stock > 0
                );

            }).length;


        const lowStock =
            products.filter(product => {

                const stock =
                    Number(product.stock) || 0;

                return (
                    stock > 0 &&
                    stock <= 5
                );

            }).length;


        const categories =
            new Set(
                products
                    .map(product => product.category)
                    .filter(Boolean)
            ).size;


        const statCards =
            document.querySelectorAll(
                ".owner-stat-card"
            );


        if (statCards[0]) {

            statCards[0]
                .querySelector("strong")
                .textContent =
                totalProducts;

        }


        if (statCards[1]) {

            statCards[1]
                .querySelector("strong")
                .textContent =
                activeProducts;

        }


        if (statCards[2]) {

            statCards[2]
                .querySelector("strong")
                .textContent =
                lowStock;

        }


        if (statCards[3]) {

            statCards[3]
                .querySelector("strong")
                .textContent =
                categories;

        }

    }


    // =====================================================
    // BUKA MODAL TAMBAH
    // =====================================================

    openButton.addEventListener(
        "click",
        () => {

            editingProduct = null;

            form.reset();

            document.querySelector(
                ".product-modal-header h2"
            ).textContent =
                "Tambah Produk";

            document.querySelector(
                ".product-save"
            ).innerHTML =
                '<i class="fa-solid fa-check"></i> Simpan Produk';

            modal.classList.add("show");

        }
    );


    // =====================================================
    // TUTUP MODAL
    // =====================================================

    function closeModal() {

        modal.classList.remove("show");

        form.reset();

        editingProduct = null;

    }


    closeButton.addEventListener(
        "click",
        closeModal
    );


    cancelButton.addEventListener(
        "click",
        closeModal
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }

        }
    );


    // =====================================================
    // SIMPAN / UPDATE PRODUK
    // =====================================================

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                productName.value.trim();

            const category =
                productCategory.value;

            const price =
                Number(productPrice.value);

            const stock =
                Number(productStock.value);

            const description =
                productDescription.value.trim();


            if (!name) {

                alert(
                    "Nama produk wajib diisi."
                );

                return;

            }


            if (!category) {

                alert(
                    "Kategori wajib dipilih."
                );

                return;

            }


            if (price < 0) {

                alert(
                    "Harga tidak boleh negatif."
                );

                return;

            }


            if (stock < 0) {

                alert(
                    "Stok tidak boleh negatif."
                );

                return;

            }


            const saveButton =
                document.querySelector(
                    ".product-save"
                );


            saveButton.disabled = true;

            saveButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';


            try {

                // =================================================
                // UPDATE
                // =================================================

                if (editingProduct) {

                    const productId =
                        editingProduct.id;


                    const result =
                        await apiRequest(
                            "/api/owner/products/" +
                            productId,
                            {
                                method: "PATCH",

                                body: JSON.stringify({
                                    name,
                                    category,
                                    price,
                                    stock,
                                    description
                                })
                            }
                        );


                    if (!result.success) {

                        throw new Error(
                            result.message ||
                            "Produk gagal diperbarui."
                        );

                    }


                    alert(
                        "Produk berhasil diperbarui."
                    );

                }

                // =================================================
                // TAMBAH
                // =================================================

                else {

                    const result =
                        await apiRequest(
                            "/api/owner/products",
                            {
                                method: "POST",

                                body: JSON.stringify({
                                    name,
                                    category,
                                    price,
                                    stock,
                                    description
                                })
                            }
                        );


                    if (!result.success) {

                        throw new Error(
                            result.message ||
                            "Produk gagal ditambahkan."
                        );

                    }


                    alert(
                        "Produk berhasil ditambahkan."
                    );

                }


                closeModal();

                await loadProducts();


            } catch (error) {

                console.error(
                    "Gagal menyimpan produk:",
                    error
                );

                alert(
                    error.message ||
                    "Gagal menyimpan produk."
                );

            } finally {

                saveButton.disabled =
                    false;

                saveButton.innerHTML =
                    '<i class="fa-solid fa-check"></i> Simpan Produk';

            }

        }
    );


    // =====================================================
    // MENU ⋯
    // =====================================================

    productList.addEventListener(
        "click",
        event => {

            const moreButton =
                event.target.closest(
                    ".product-more"
                );


            if (!moreButton) {
                return;
            }


            const productId =
                Number(
                    moreButton.dataset.id
                );


            const product =
                products.find(
                    item =>
                        Number(item.id) ===
                        productId
                );


            if (!product) {
                return;
            }


            document
                .querySelectorAll(
                    ".product-action-menu"
                )
                .forEach(
                    menu => menu.remove()
                );


            const productItem =
                moreButton.closest(
                    ".product-item"
                );


            const menu =
                document.createElement(
                    "div"
                );


            menu.className =
                "product-action-menu";


            menu.innerHTML = `
                <button
                    type="button"
                    data-action="edit"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>

                <button
                    type="button"
                    data-action="delete"
                >
                    <i class="fa-solid fa-trash"></i>
                    Hapus
                </button>
            `;


            productItem.appendChild(
                menu
            );


            // =================================================
            // EDIT
            // =================================================

            menu.querySelector(
                '[data-action="edit"]'
            ).addEventListener(
                "click",
                () => {

                    productName.value =
                        product.name || "";

                    productCategory.value =
                        product.category || "";

                    productPrice.value =
                        product.price || 0;

                    productStock.value =
                        product.stock || 0;

                    productDescription.value =
                        product.description || "";


                    editingProduct =
                        product;


                    document.querySelector(
                        ".product-modal-header h2"
                    ).textContent =
                        "Edit Produk";


                    document.querySelector(
                        ".product-save"
                    ).innerHTML =
                        '<i class="fa-solid fa-check"></i> Simpan Perubahan';


                    modal.classList.add(
                        "show"
                    );

                    menu.remove();

                }
            );


            // =================================================
            // HAPUS
            // =================================================

            menu.querySelector(
                '[data-action="delete"]'
            ).addEventListener(
                "click",
                async () => {

                    const confirmDelete =
                        confirm(
                            `Hapus produk "${product.name}"?`
                        );


                    if (!confirmDelete) {

                        menu.remove();

                        return;

                    }


                    try {

                        const result =
                            await apiRequest(
                                "/api/owner/products/" +
                                product.id,
                                {
                                    method: "DELETE"
                                }
                            );


                        if (!result.success) {

                            throw new Error(
                                result.message ||
                                "Produk gagal dihapus."
                            );

                        }


                        alert(
                            "Produk berhasil dihapus."
                        );


                        menu.remove();

                        await loadProducts();


                    } catch (error) {

                        console.error(
                            "Gagal menghapus produk:",
                            error
                        );

                        alert(
                            error.message ||
                            "Gagal menghapus produk."
                        );

                    }

                }
            );

        }
    );


    // =====================================================
    // FILTER
    // =====================================================

    filterButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            filterMenu.classList.toggle(
                "show"
            );

        }
    );


    filterMenu.addEventListener(
        "click",
        event => {

            const filterOption =
                event.target.closest(
                    "[data-filter]"
                );


            if (!filterOption) {
                return;
            }


            const selectedFilter =
                filterOption.dataset.filter;


            filterText.textContent =
                selectedFilter;


            filterMenu.classList.remove(
                "show"
            );


            renderProducts();

        }
    );


    // =====================================================
    // KLIK DI LUAR MENU
    // =====================================================

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".product-more"
                ) &&
                !event.target.closest(
                    ".product-action-menu"
                )
            ) {

                document
                    .querySelectorAll(
                        ".product-action-menu"
                    )
                    .forEach(
                        menu => menu.remove()
                    );

            }


            if (
                !event.target.closest(
                    "#productFilterButton"
                ) &&
                !event.target.closest(
                    "#productFilterMenu"
                )
            ) {

                filterMenu.classList.remove(
                    "show"
                );

            }

        }
    );


    // =====================================================
    // MULAI
    // =====================================================

    loadProducts();

});