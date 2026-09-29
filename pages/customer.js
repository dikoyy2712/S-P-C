document.addEventListener("DOMContentLoaded", async function () {

    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("business");

    const API_URL = "";

    let products = [];
    let cart = [];
    let selectedCategory = "Semua";

    // ==========================================
    // ELEMENT
    // ==========================================

    const businessName =
        document.querySelector(".customer-brand strong");

    const businessStatus =
        document.querySelector(".customer-brand span");

    const heroTitle =
        document.getElementById("heroTitle");

    const heroDescription =
        document.getElementById("heroDescription");

    const businessAddress =
        document.getElementById("businessAddress");

    const businessHours =
        document.getElementById("businessHours");

    const productContainer =
        document.getElementById("productContainer");

    const searchInput =
        document.getElementById("productSearch");

    const cartButton =
        document.getElementById("cartButton");

    const cartCount =
        document.getElementById("cartCount");

    const cartOverlay =
        document.getElementById("cartOverlay");

    const closeCart =
        document.getElementById("closeCart");

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    const orderButton =
        document.getElementById("orderButton");

    const checkOrderButton =
        document.getElementById("checkOrderButton");

    const orderStatusOverlay =
        document.getElementById("orderStatusOverlay");

    const closeOrderStatus =
        document.getElementById("closeOrderStatus");

    const orderNumberInput =
        document.getElementById("orderNumberInput");

    const checkOrderStatusButton =
        document.getElementById("checkOrderStatus");

    const orderStatusResult =
        document.getElementById("orderStatusResult");


    // ==========================================
    // FORMAT RUPIAH
    // ==========================================

    function formatRupiah(value) {

        return new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }
        ).format(Number(value) || 0);

    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ==========================================
    // JIKA QR TIDAK VALID
    // ==========================================

    if (!businessId) {

        businessName.textContent =
            "Bisnis tidak ditemukan";

        businessStatus.textContent =
            "QR Code tidak valid";

        heroTitle.textContent =
            "Halaman Bisnis Tidak Ditemukan";

        heroDescription.textContent =
            "Silakan scan QR Code bisnis yang tersedia.";

        productContainer.innerHTML = `
            <div class="customer-empty">

                <div class="customer-empty-icon">
                    <i class="fa-solid fa-qrcode"></i>
                </div>

                <h3>
                    QR Code Tidak Valid
                </h3>

                <p>
                    Halaman ini harus dibuka melalui QR Code bisnis SPC.
                </p>

            </div>
        `;

        return;

    }


    // ==========================================
    // AMBIL DATA BISNIS
    // ==========================================

    async function loadBusiness() {

        const response = await fetch(
            API_URL +
            "/api/businesses/" +
            encodeURIComponent(businessId)
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Bisnis tidak ditemukan"
            );

        }

        const business = result.data;

        businessName.textContent =
            business.name || "Nama Bisnis";

        businessStatus.textContent =
            "Bisnis Terverifikasi";

        heroTitle.textContent =
            "Selamat Datang di " +
            (business.name || "Bisnis");

        heroDescription.textContent =
            business.description ||
            "Lihat produk dan layanan yang tersedia dari bisnis ini.";

        businessAddress.innerHTML =
            '<i class="fa-solid fa-location-dot"></i> ' +
            escapeHtml(
                business.address ||
                "Alamat belum tersedia"
            );

        const openTime =
            business.open_time || "-";

        const closeTime =
            business.close_time || "-";

        businessHours.innerHTML =
            '<i class="fa-solid fa-clock"></i> ' +
            escapeHtml(openTime) +
            " - " +
            escapeHtml(closeTime);

    }


    // ==========================================
    // AMBIL PRODUK BISNIS
    // ==========================================

    async function loadProducts() {

        productContainer.innerHTML = `
            <div class="customer-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <p>
                    Memuat produk...
                </p>

            </div>
        `;

        const response = await fetch(
            API_URL +
            "/api/businesses/" +
            encodeURIComponent(businessId) +
            "/products"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Produk gagal dimuat"
            );

        }

        products = result.data || [];

        renderProducts();

    }


    // ==========================================
    // RENDER PRODUK
    // ==========================================

    function renderProducts() {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();

        const filteredProducts =
            products.filter(product => {

                const matchCategory =
                    selectedCategory === "Semua" ||
                    String(product.category || "")
                        .toLowerCase() ===
                    selectedCategory.toLowerCase();

                const matchSearch =
                    String(product.name || "")
                        .toLowerCase()
                        .includes(keyword);

                return matchCategory && matchSearch;

            });


        if (filteredProducts.length === 0) {

            productContainer.innerHTML = `
                <div class="customer-empty">

                    <div class="customer-empty-icon">
                        <i class="fa-solid fa-box-open"></i>
                    </div>

                    <h3>
                        Belum ada produk
                    </h3>

                    <p>
                        Tidak ada produk yang sesuai dengan pencarian Anda.
                    </p>

                </div>
            `;

            return;

        }


        productContainer.innerHTML =
            filteredProducts.map(product => {

                const stock =
                    Number(product.stock) || 0;

                const disabled =
                    stock <= 0 ? "disabled" : "";

                return `

                    <div class="customer-product-card">

                        <div class="customer-product-icon">
                            <i class="fa-solid fa-box"></i>
                        </div>

                        <span class="customer-product-category">
                            ${escapeHtml(
                                product.category ||
                                "Lainnya"
                            )}
                        </span>

                        <h3>
                            ${escapeHtml(product.name)}
                        </h3>

                        <p class="customer-product-description">
                            ${escapeHtml(
                                product.description ||
                                "Produk tersedia untuk dipesan."
                            )}
                        </p>

                        <div class="customer-product-bottom">

                            <div>

                                <div class="customer-product-price">
                                    ${formatRupiah(product.price)}
                                </div>

                                <div class="customer-stock">
                                    ${stock > 0
                                        ? "Stok: " + stock
                                        : "Stok habis"}
                                </div>

                            </div>

                            <button
                                class="customer-add-button"
                                type="button"
                                data-product-id="${product.id}"
                                title="${stock > 0
                                    ? "Tambah ke keranjang"
                                    : "Stok habis"}"
                                ${disabled}>

                                <i class="fa-solid fa-plus"></i>

                            </button>

                        </div>

                    </div>
                `;

            }).join("");


        document
            .querySelectorAll(".customer-add-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const productId =
                            Number(
                                this.dataset.productId
                            );

                        addToCart(productId);

                    }
                );

            });

    }


    // ==========================================
    // TAMBAH KE KERANJANG
    // ==========================================

    function addToCart(productId) {

        const product =
            products.find(
                item =>
                    Number(item.id) === productId
            );

        if (!product) return;

        const stock =
            Number(product.stock) || 0;

        if (stock <= 0) {

            alert("Produk sedang habis.");

            return;

        }

        const existing =
            cart.find(
                item =>
                    Number(item.id) === productId
            );


        if (existing) {

            if (existing.quantity >= stock) {

                alert(
                    "Jumlah melebihi stok yang tersedia."
                );

                return;

            }

            existing.quantity++;

        } else {

            cart.push({

                id: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                stock: stock,
                quantity: 1

            });

        }

        updateCart();

    }


    // ==========================================
    // UPDATE KERANJANG
    // ==========================================

    function updateCart() {

        const totalItems =
            cart.reduce(
                (total, item) =>
                    total + item.quantity,
                0
            );

        cartCount.textContent =
            totalItems;


        if (cart.length === 0) {

            cartItems.innerHTML = `
                <div class="customer-cart-empty">

                    <i class="fa-solid fa-cart-shopping"></i>

                    <div>
                        Keranjang masih kosong.
                    </div>

                </div>
            `;

            cartTotal.textContent =
                "Rp 0";

            orderButton.disabled =
                true;

            return;

        }


        let totalPrice = 0;


        cartItems.innerHTML =
            cart.map(item => {

                const subtotal =
                    item.price *
                    item.quantity;

                totalPrice += subtotal;


                return `

                    <div class="customer-cart-item">

                        <div class="customer-cart-item-info">

                            <strong>
                                ${escapeHtml(item.name)}
                            </strong>

                            <span class="customer-cart-item-price">
                                ${formatRupiah(item.price)}
                            </span>

                        </div>

                        <div class="customer-cart-controls">

                            <button
                                type="button"
                                data-cart-action="minus"
                                data-id="${item.id}">

                                <i class="fa-solid fa-minus"></i>

                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                data-cart-action="plus"
                                data-id="${item.id}">

                                <i class="fa-solid fa-plus"></i>

                            </button>

                        </div>

                    </div>

                `;

            }).join("");


        cartTotal.textContent =
            formatRupiah(totalPrice);

        orderButton.disabled =
            false;


        document
            .querySelectorAll("[data-cart-action]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.id
                            );

                        const action =
                            this.dataset.cartAction;

                        changeCartQuantity(
                            id,
                            action
                        );

                    }
                );

            });

    }


    // ==========================================
    // UBAH JUMLAH
    // ==========================================

    function changeCartQuantity(
        productId,
        action
    ) {

        const item =
            cart.find(
                product =>
                    Number(product.id) ===
                    productId
            );

        if (!item) return;


        if (action === "plus") {

            if (item.quantity >= item.stock) {

                alert(
                    "Jumlah sudah mencapai stok tersedia."
                );

                return;

            }

            item.quantity++;

        }


        if (action === "minus") {

            item.quantity--;

            if (item.quantity <= 0) {

                cart =
                    cart.filter(
                        product =>
                            Number(product.id) !==
                            productId
                    );

            }

        }


        updateCart();

    }


    // ==========================================
    // FILTER KATEGORI
    // ==========================================

    document
        .querySelectorAll(
            "#categoryButtons button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            "#categoryButtons button"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    this.classList.add("active");

                    selectedCategory =
                        this.dataset.category;

                    renderProducts();

                }
            );

        });


    // ==========================================
    // SEARCH
    // ==========================================

    searchInput.addEventListener(
        "input",
        function () {

            renderProducts();

        }
    );


    // ==========================================
    // BUKA KERANJANG
    // ==========================================

    cartButton.addEventListener(
        "click",
        function () {

            cartOverlay.classList.add("show");

            updateCart();

        }
    );


    // ==========================================
    // TUTUP KERANJANG
    // ==========================================

    closeCart.addEventListener(
        "click",
        function () {

            cartOverlay.classList.remove(
                "show"
            );

        }
    );


    cartOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                cartOverlay
            ) {

                cartOverlay.classList.remove(
                    "show"
                );

            }

        }
    );


    // ==========================================
    // PESAN
    // ==========================================

    orderButton.addEventListener(
        "click",
        async function () {

            if (cart.length === 0) {

                alert(
                    "Keranjang masih kosong."
                );

                return;

            }


            orderButton.disabled = true;

            orderButton.textContent =
                "Mengirim Pesanan...";


            try {

                const items =
                    cart.map(item => ({

                        product_id:
                            Number(item.id),

                        quantity:
                            Number(item.quantity)

                    }));


                const response =
                    await fetch(
                        API_URL + "/api/orders",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                business_id:
                                    Number(businessId),

                                customer_id:
                                    null,

                                items:
                                    items

                            })

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
                        "Pesanan gagal dikirim."
                    );

                }


                alert(
                    "Pesanan berhasil dibuat!\n\n" +
                    "Nomor Pesanan: " +
                    result.order.order_number +
                    "\nTotal: " +
                    formatRupiah(
                        result.order.total
                    )
                );


                localStorage.setItem(
                    "spc_last_order_" + businessId,
                    result.order.order_number
                );


                cart = [];

                updateCart();


                cartOverlay.classList.remove(
                    "show"
                );


                await loadProducts();

            } catch (error) {

                console.error(
                    "Order error:",
                    error
                );

                alert(
                    "Pesanan gagal dikirim.\n\n" +
                    error.message
                );

            } finally {

                orderButton.disabled =
                    cart.length === 0;

                orderButton.textContent =
                    "Lanjutkan Pesanan";

            }

        }
    );


    // ==========================================
    // CEK STATUS PESANAN
    // ==========================================

    checkOrderButton.addEventListener(
        "click",
        function () {

            const savedOrder =
                localStorage.getItem(
                    "spc_last_order_" + businessId
                );

            orderNumberInput.value =
                savedOrder || "";

            orderStatusResult.innerHTML = "";

            orderStatusOverlay.classList.add(
                "show"
            );

        }
    );


    closeOrderStatus.addEventListener(
        "click",
        function () {

            orderStatusOverlay.classList.remove(
                "show"
            );

        }
    );


    orderStatusOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                orderStatusOverlay
            ) {

                orderStatusOverlay.classList.remove(
                    "show"
                );

            }

        }
    );


    checkOrderStatusButton.addEventListener(
        "click",
        async function () {

            const orderNumber =
                orderNumberInput.value
                    .trim()
                    .toUpperCase();

            if (!orderNumber) {

                alert(
                    "Masukkan nomor pesanan."
                );

                return;

            }

            checkOrderStatusButton.disabled =
                true;

            checkOrderStatusButton.textContent =
                "Mengecek...";


            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/orders/" +
                        encodeURIComponent(orderNumber) +
                        "/status?business_id=" +
                        encodeURIComponent(businessId)
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Pesanan tidak ditemukan."
                    );

                }


                const order =
                    result.order;


                let statusText =
                    "Menunggu";

                let statusIcon =
                    "fa-clock";


                if (
                    order.status ===
                    "processing"
                ) {

                    statusText =
                        "Sedang Diproses";

                    statusIcon =
                        "fa-spinner";

                }


                if (
                    order.status ===
                    "completed"
                ) {

                    statusText =
                        "Selesai";

                    statusIcon =
                        "fa-circle-check";

                }


                if (
                    order.status ===
                    "cancelled"
                ) {

                    statusText =
                        "Dibatalkan";

                    statusIcon =
                        "fa-circle-xmark";

                }


                orderStatusResult.innerHTML = `

                    <div style="
                        padding:18px;
                        border-radius:15px;
                        background:rgba(255,255,255,.04);
                        border:1px solid rgba(255,255,255,.08);
                    ">

                        <div style="
                            font-size:13px;
                            color:rgba(255,255,255,.5);
                            margin-bottom:7px;
                        ">
                            Nomor Pesanan
                        </div>

                        <strong>
                            ${escapeHtml(
                                order.order_number
                            )}
                        </strong>

                        <div style="
                            margin-top:18px;
                            font-size:13px;
                            color:rgba(255,255,255,.5);
                            margin-bottom:7px;
                        ">
                            Status
                        </div>

                        <div style="
                            font-size:18px;
                            font-weight:700;
                        ">

                            <i class="fa-solid ${statusIcon}"></i>

                            ${statusText}

                        </div>

                        <div style="
                            margin-top:12px;
                            color:rgba(255,255,255,.55);
                            font-size:13px;
                        ">

                            Total:
                            ${formatRupiah(order.total)}

                        </div>

                    </div>

                `;

            } catch (error) {

                orderStatusResult.innerHTML = `

                    <div style="
                        padding:15px;
                        border-radius:12px;
                        background:rgba(255,70,70,.08);
                        border:1px solid rgba(255,70,70,.15);
                        color:#ff8d8d;
                    ">

                        <i class="fa-solid fa-circle-exclamation"></i>

                        ${escapeHtml(
                            error.message
                        )}

                    </div>

                `;

            } finally {

                checkOrderStatusButton.disabled =
                    false;

                checkOrderStatusButton.textContent =
                    "Cek Status";

            }

        }
    );


    // ==========================================
    // LOAD AWAL
    // ==========================================

    try {

        await loadBusiness();

        await loadProducts();

        updateCart();

    } catch (error) {

        console.error(
            "Customer page error:",
            error
        );


        businessName.textContent =
            "Bisnis tidak ditemukan";

        businessStatus.textContent =
            "Tidak tersedia";

        heroTitle.textContent =
            "Bisnis Tidak Ditemukan";

        heroDescription.textContent =
            "Bisnis mungkin belum diverifikasi atau QR Code tidak valid.";


        productContainer.innerHTML = `
            <div class="customer-empty">

                <div class="customer-empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>
                    Gagal Memuat Halaman
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;

    }

});