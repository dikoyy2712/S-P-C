require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(helmet());

app.use(express.json({
    type: "*/*"
}));

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// ===============================
// STATUS BACKEND
// ===============================
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Backend SPC aktif"
    });
});

// ===============================
// DAFTAR BISNIS UNTUK CUSTOMER
// ===============================
app.get("/api/businesses", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                category,
                logo_url,
                description,
                address,
                phone,
                email,
                open_time,
                close_time,
                verification_status
            FROM businesses
            WHERE verification_status = 'approved'
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "Gagal mengambil bisnis:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data bisnis"
        });
    }
});


// ===============================
// ADMIN - DAFTAR BISNIS
// ===============================
app.get("/api/admin/businesses", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                b.id,
                b.owner_id,
                b.name AS business_name,
                b.category,
                b.address,
                b.phone,
                b.email,
                b.verification_status,
                b.created_at,
                u.name AS owner_name,
                u.email AS owner_email
            FROM businesses b
            LEFT JOIN users u
                ON b.owner_id = u.id
            ORDER BY b.id DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "Gagal mengambil daftar bisnis:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar bisnis"
        });
    }
});


// ===============================
// REGISTER OWNER
// ===============================
app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            business,
            password
        } = req.body;

        if (!name || !email || !business || !password) {
            return res.status(400).json({
                success: false,
                message: "Semua data wajib diisi"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanBusiness = business.trim();

        const existingUser = await pool.query(
            `
            SELECT id
            FROM users
            WHERE LOWER(email) = $1
            `,
            [cleanEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email sudah terdaftar"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userResult = await pool.query(
            `
            INSERT INTO users
            (
                name,
                email,
                password_hash,
                role,
                status
            )
            VALUES ($1, $2, $3, 'owner', 'pending')
            RETURNING id, name, email, role, status
            `,
            [
                cleanName,
                cleanEmail,
                passwordHash
            ]
        );

        const user = userResult.rows[0];

        res.status(201).json({
            success: true,
            message: "Registrasi berhasil. Menunggu verifikasi Admin SPC.",
            user
        });

    } catch (error) {
        console.error(
            "Register error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server"
        });
    }
});


// ===============================
// LOGIN
// ===============================
app.post("/api/login", async (req, res) => {

    console.log("=== LOGIN ROUTE TERPANGGIL ===");
    console.log(req.body);

    try {

        const {
    email,
    password
} = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password wajib diisi"
            });
        }

        const cleanEmail =
            email.trim().toLowerCase();

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                password_hash,
                role,
                status
            FROM users
            WHERE LOWER(email) = $1
            `,
            [cleanEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        const user = result.rows[0];

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        console.log(
            "LOGIN:",
            user.email,
            "| ROLE:",
            user.role,
            "| PASSWORD:",
            passwordMatch
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Akun masih menunggu verifikasi Admin SPC"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET tidak ditemukan di .env"
            );

            return res.status(500).json({
                success: false,
                message: "Konfigurasi server belum lengkap"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login berhasil",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server"
        });
    }
});


// ===============================
// ADMIN - VERIFIKASI USER
// ===============================
app.patch("/api/admin/users/:id/approve", async (req, res) => {
    try {

        const userId = req.params.id;

        const result = await pool.query(
            `
            UPDATE users
            SET status = 'active'
            WHERE id = $1
            RETURNING id, name, email, role, status
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pengguna tidak ditemukan"
            });
        }

        res.json({
            success: true,
            message: "Pengguna berhasil diaktifkan",
            data: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Gagal mengaktifkan pengguna:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengaktifkan pengguna"
        });
    }
});


// ===============================
// ADMIN - DAFTAR PENGGUNA
// ===============================
app.get("/api/admin/users", async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT
                id,
                name,
                email,
                role,
                status,
                created_at
            FROM users
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {

        console.error(
            "Gagal mengambil daftar pengguna:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar pengguna"
        });
    }
});


// ===============================
// ADMIN - LAPORAN
// ===============================
app.get("/api/admin/reports", async (req, res) => {
    try {

        const userResult = await pool.query(`
            SELECT COUNT(*) AS total
            FROM users
        `);

        const ownerResult = await pool.query(`
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'owner'
        `);

        const businessResult = await pool.query(`
            SELECT COUNT(*) AS total
            FROM businesses
        `);

        const customerResult = await pool.query(`
            SELECT COUNT(*) AS total
            FROM customers
        `);

        const orderResult = await pool.query(`
            SELECT COUNT(*) AS total
            FROM orders
        `);

        const revenueResult = await pool.query(`
            SELECT COALESCE(SUM(total), 0) AS total
            FROM orders
            WHERE status = 'completed'
        `);

        res.json({
            success: true,
            data: {
                total_users: Number(
                    userResult.rows[0].total
                ),

                total_owners: Number(
                    ownerResult.rows[0].total
                ),

                total_businesses: Number(
                    businessResult.rows[0].total
                ),

                total_customers: Number(
                    customerResult.rows[0].total
                ),

                total_orders: Number(
                    orderResult.rows[0].total
                ),

                total_revenue: Number(
                    revenueResult.rows[0].total
                )
            }
        });

    } catch (error) {

        console.error(
            "Gagal mengambil laporan:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data laporan"
        });
    }
});


// ===============================
// AUTH - CEK TOKEN OWNER
// ===============================
async function authenticateOwner(req, res, next) {

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan"
            });
        }

        const token =
            authHeader.split(" ")[1];

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET tidak ditemukan"
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (decoded.role !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Akses hanya untuk Owner"
            });
        }

        const businessResult =
            await pool.query(
                `
                SELECT id
                FROM businesses
                WHERE owner_id = $1
                ORDER BY id DESC
                LIMIT 1
                `,
                [decoded.id]
            );

        req.user = decoded;

        req.user.business_id =
            businessResult.rows.length > 0
                ? businessResult.rows[0].id
                : null;

        next();

    } catch (error) {

        console.error(
            "Auth owner error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah kedaluwarsa"
        });
    }
}


// ===============================
// OWNER - AMBIL PROFIL BISNIS
// ===============================
app.get(
    "/api/owner/business",
    authenticateOwner,
    async (req, res) => {

        try {

            const ownerId =
                req.user.id;

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        owner_id,
                        name,
                        category,
                        logo_url,
                        description,
                        address,
                        phone,
                        email,
                        open_time,
                        close_time,
                        verification_status,
                        rejection_reason,
                        created_at
                    FROM businesses
                    WHERE owner_id = $1
                    ORDER BY id DESC
                    LIMIT 1
                    `,
                    [ownerId]
                );

            if (result.rows.length === 0) {

                return res.json({
                    success: true,
                    data: null
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal mengambil profil bisnis Owner:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: "Gagal mengambil profil bisnis"
            });
        }
    }
);


// ===============================
// OWNER - SIMPAN / UPDATE BISNIS
// ===============================
app.post(
    "/api/owner/business",
    authenticateOwner,
    async (req, res) => {

        try {

            const ownerId =
                req.user.id;

            const {
                name,
                category,
                address,
                phone,
                email,
                open_time,
                close_time,
                description
            } = req.body;

            if (!name || !category || !address) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Nama bisnis, kategori, dan alamat wajib diisi"
                });
            }

            const cleanName =
                name.trim();

            const cleanCategory =
                category.trim();

            const cleanAddress =
                address.trim();

            const cleanPhone =
                phone
                    ? phone.trim()
                    : null;

            const cleanEmail =
                email
                    ? email.trim().toLowerCase()
                    : null;

            const cleanDescription =
                description
                    ? description.trim()
                    : null;

            const existingBusiness =
                await pool.query(
                    `
                    SELECT
                        id,
                        verification_status
                    FROM businesses
                    WHERE owner_id = $1
                    ORDER BY id DESC
                    LIMIT 1
                    `,
                    [ownerId]
                );

            if (existingBusiness.rows.length > 0) {

                const businessId =
                    existingBusiness.rows[0].id;

                const result =
                    await pool.query(
                        `
                        UPDATE businesses
                        SET
                            name = $1,
                            category = $2,
                            address = $3,
                            phone = $4,
                            email = $5,
                            open_time = $6,
                            close_time = $7,
                            description = $8
                        WHERE id = $9
                          AND owner_id = $10
                        RETURNING
                            id,
                            owner_id,
                            name,
                            category,
                            logo_url,
                            description,
                            address,
                            phone,
                            email,
                            open_time,
                            close_time,
                            verification_status,
                            rejection_reason,
                            created_at
                        `,
                        [
                            cleanName,
                            cleanCategory,
                            cleanAddress,
                            cleanPhone,
                            cleanEmail,
                            open_time || null,
                            close_time || null,
                            cleanDescription,
                            businessId,
                            ownerId
                        ]
                    );

                return res.json({
                    success: true,
                    message:
                        "Profil bisnis berhasil diperbarui",
                    data: result.rows[0]
                });
            }

            const result =
                await pool.query(
                    `
                    INSERT INTO businesses
                    (
                        owner_id,
                        name,
                        category,
                        description,
                        address,
                        phone,
                        email,
                        open_time,
                        close_time,
                        verification_status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        'pending'
                    )
                    RETURNING
                        id,
                        owner_id,
                        name,
                        category,
                        logo_url,
                        description,
                        address,
                        phone,
                        email,
                        open_time,
                        close_time,
                        verification_status,
                        rejection_reason,
                        created_at
                    `,
                    [
                        ownerId,
                        cleanName,
                        cleanCategory,
                        cleanDescription,
                        cleanAddress,
                        cleanPhone,
                        cleanEmail,
                        open_time || null,
                        close_time || null
                    ]
                );

            res.status(201).json({
                success: true,
                message:
                    "Profil bisnis berhasil disimpan dan menunggu verifikasi Admin SPC",
                data: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal menyimpan profil bisnis:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal menyimpan profil bisnis"
            });
        }
    }
);


// ===============================
// OWNER - DASHBOARD
// ===============================
app.get("/api/owner/dashboard", async (req, res) => {

    try {

        const ownerId =
            Number(req.query.owner_id);

        if (
            !Number.isInteger(ownerId) ||
            ownerId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Owner ID tidak valid"
            });
        }

        const businessResult =
            await pool.query(
                `
                SELECT
                    id,
                    name,
                    verification_status
                FROM businesses
                WHERE owner_id = $1
                ORDER BY id DESC
                LIMIT 1
                `,
                [ownerId]
            );

        if (businessResult.rows.length === 0) {

            return res.json({
                success: true,
                data: {
                    business: null,
                    orders_today: 0,
                    total_customers: 0,
                    total_products: 0,
                    revenue_month: 0,
                    recent_orders: [],
                    activity: []
                }
            });
        }

        const business =
            businessResult.rows[0];

        const businessId =
            business.id;

        const ordersTodayResult =
            await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM orders
                WHERE business_id = $1
                  AND created_at::date = CURRENT_DATE
                `,
                [businessId]
            );

        const customersResult =
            await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM customers
                WHERE business_id = $1
                `,
                [businessId]
            );

        const productsResult =
            await pool.query(
                `
                SELECT COUNT(*) AS total
                FROM products
                WHERE business_id = $1
                `,
                [businessId]
            );

        const revenueResult =
            await pool.query(
                `
                SELECT COALESCE(SUM(total), 0) AS total
                FROM orders
                WHERE business_id = $1
                  AND status = 'completed'
                  AND created_at >= date_trunc('month', CURRENT_DATE)
                `,
                [businessId]
            );

        const recentOrdersResult =
            await pool.query(
                `
                SELECT
                    id,
                    COALESCE(
                        NULLIF(
                            to_jsonb(orders)->>'order_number',
                            ''
                        ),
                        'SPC-' || id::text
                    ) AS order_number,
                    COALESCE(
                        NULLIF(
                            to_jsonb(orders)->>'status',
                            ''
                        ),
                        'pending'
                    ) AS status,
                    COALESCE(
                        NULLIF(
                            to_jsonb(orders)->>'total',
                            ''
                        )::numeric,
                        0
                    ) AS total,
                    created_at
                FROM orders
                WHERE business_id = $1
                ORDER BY created_at DESC
                LIMIT 3
                `,
                [businessId]
            );

        const activityResult =
            await pool.query(
                `
                SELECT
                    TO_CHAR(day, 'Dy') AS day,
                    COALESCE(COUNT(o.id), 0)::int AS total
                FROM generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                ) AS day
                LEFT JOIN orders o
                    ON o.business_id = $1
                    AND o.created_at::date = day::date
                GROUP BY day
                ORDER BY day
                `,
                [businessId]
            );

        const dayMap = {
            Mon: "Sen",
            Tue: "Sel",
            Wed: "Rab",
            Thu: "Kam",
            Fri: "Jum",
            Sat: "Sab",
            Sun: "Min"
        };

        const activity =
            activityResult.rows.map(item => ({
                day:
                    dayMap[item.day] ||
                    item.day,
                total:
                    Number(item.total)
            }));

        res.json({
            success: true,
            data: {
                business,
                orders_today:
                    Number(
                        ordersTodayResult.rows[0].total
                    ),
                total_customers:
                    Number(
                        customersResult.rows[0].total
                    ),
                total_products:
                    Number(
                        productsResult.rows[0].total
                    ),
                revenue_month:
                    Number(
                        revenueResult.rows[0].total
                    ),
                recent_orders:
                    recentOrdersResult.rows,
                activity
            }
        });

    } catch (error) {

        console.error(
            "Gagal mengambil dashboard owner:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Gagal mengambil data dashboard"
        });
    }
});


// ===============================
// ADMIN - VERIFIKASI BISNIS
// ===============================
app.patch(
    "/api/admin/businesses/:id/approve",
    async (req, res) => {

        try {

            const businessId =
                req.params.id;

            const result =
                await pool.query(
                    `
                    UPDATE businesses
                    SET verification_status = 'approved'
                    WHERE id = $1
                    RETURNING
                        id,
                        owner_id,
                        name,
                        category,
                        verification_status
                    `,
                    [businessId]
                );

            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Bisnis tidak ditemukan"
                });
            }

            res.json({
                success: true,
                message:
                    "Bisnis berhasil diverifikasi",
                data:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal memverifikasi bisnis:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal memverifikasi bisnis"
            });
        }
    }
);


// ===============================
// CUSTOMER - DETAIL BISNIS
// ===============================
app.get(
    "/api/businesses/:id",
    async (req, res) => {

        try {

            const businessId =
                req.params.id;

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        category,
                        logo_url,
                        description,
                        address,
                        phone,
                        email,
                        open_time,
                        close_time,
                        verification_status
                    FROM businesses
                    WHERE id = $1
                      AND verification_status = 'approved'
                    LIMIT 1
                    `,
                    [businessId]
                );

            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Bisnis tidak ditemukan atau belum disetujui"
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal mengambil detail bisnis:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil data bisnis"
            });
        }
    }
);


// =====================================================
// OWNER - GET PRODUK
// =====================================================
app.get(
    "/api/owner/products",
    authenticateOwner,
    async (req, res) => {

        try {

            const businessId =
                req.user.business_id;

            if (!businessId) {

                return res.json({
                    success: true,
                    data: []
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        business_id,
                        name,
                        category,
                        description,
                        price,
                        stock,
                        status,
                        image_url,
                        created_at
                    FROM products
                    WHERE business_id = $1
                    ORDER BY id DESC
                    `,
                    [businessId]
                );

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {

            console.error(
                "Gagal mengambil produk:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil produk"
            });
        }
    }
);


// =====================================================
// OWNER - TAMBAH PRODUK
// =====================================================
app.post(
    "/api/owner/products",
    authenticateOwner,
    async (req, res) => {

        try {

            const businessId =
                req.user.business_id;

            if (!businessId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Anda belum memiliki profil bisnis"
                });
            }

            const {
                name,
                category,
                description,
                price,
                stock
            } = req.body;

            if (
                !name ||
                !category ||
                price === undefined ||
                stock === undefined
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Nama, kategori, harga, dan stok wajib diisi"
                });
            }

            const cleanName =
                String(name).trim();

            const cleanCategory =
                String(category).trim();

            const cleanDescription =
                description
                    ? String(description).trim()
                    : null;

            const cleanPrice =
                Number(price);

            const cleanStock =
                Number(stock);

            if (!cleanName) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Nama produk tidak boleh kosong"
                });
            }

            if (
                !Number.isFinite(cleanPrice) ||
                cleanPrice < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Harga produk tidak valid"
                });
            }

            if (
                !Number.isInteger(cleanStock) ||
                cleanStock < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Stok produk tidak valid"
                });
            }

            const result =
                await pool.query(
                    `
                    INSERT INTO products
                    (
                        business_id,
                        name,
                        category,
                        description,
                        price,
                        stock,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        'active'
                    )
                    RETURNING
                        id,
                        business_id,
                        name,
                        category,
                        description,
                        price,
                        stock,
                        status,
                        image_url,
                        created_at
                    `,
                    [
                        businessId,
                        cleanName,
                        cleanCategory,
                        cleanDescription,
                        cleanPrice,
                        cleanStock
                    ]
                );

            res.status(201).json({
                success: true,
                message:
                    "Produk berhasil ditambahkan",
                data:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal menambahkan produk:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal menambahkan produk"
            });
        }
    }
);


// =====================================================
// OWNER - UPDATE PRODUK
// =====================================================
app.patch(
    "/api/owner/products/:id",
    authenticateOwner,
    async (req, res) => {

        try {

            const businessId =
                req.user.business_id;

            const productId =
                Number(req.params.id);

            if (!businessId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Anda belum memiliki profil bisnis"
                });
            }

            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "ID produk tidak valid"
                });
            }

            const {
                name,
                category,
                description,
                price,
                stock
            } = req.body;

            if (
                !name ||
                !category ||
                price === undefined ||
                stock === undefined
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Nama, kategori, harga, dan stok wajib diisi"
                });
            }

            const cleanName =
                String(name).trim();

            const cleanCategory =
                String(category).trim();

            const cleanDescription =
                description
                    ? String(description).trim()
                    : null;

            const cleanPrice =
                Number(price);

            const cleanStock =
                Number(stock);

            if (!cleanName) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Nama produk tidak boleh kosong"
                });
            }

            if (
                !Number.isFinite(cleanPrice) ||
                cleanPrice < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Harga produk tidak valid"
                });
            }

            if (
                !Number.isInteger(cleanStock) ||
                cleanStock < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Stok produk tidak valid"
                });
            }

            const result =
                await pool.query(
                    `
                    UPDATE products
                    SET
                        name = $1,
                        category = $2,
                        description = $3,
                        price = $4,
                        stock = $5
                    WHERE id = $6
                      AND business_id = $7
                    RETURNING
                        id,
                        business_id,
                        name,
                        category,
                        description,
                        price,
                        stock,
                        status,
                        image_url,
                        created_at
                    `,
                    [
                        cleanName,
                        cleanCategory,
                        cleanDescription,
                        cleanPrice,
                        cleanStock,
                        productId,
                        businessId
                    ]
                );

            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            res.json({
                success: true,
                message:
                    "Produk berhasil diperbarui",
                data:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal memperbarui produk:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal memperbarui produk"
            });
        }
    }
);


// =====================================================
// OWNER - HAPUS PRODUK
// =====================================================
app.delete(
    "/api/owner/products/:id",
    authenticateOwner,
    async (req, res) => {

        try {

            const businessId =
                req.user.business_id;

            const productId =
                Number(req.params.id);

            if (!businessId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Anda belum memiliki profil bisnis"
                });
            }

            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "ID produk tidak valid"
                });
            }

            const result =
                await pool.query(
                    `
                    DELETE FROM products
                    WHERE id = $1
                      AND business_id = $2
                    RETURNING id, name
                    `,
                    [
                        productId,
                        businessId
                    ]
                );

            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            res.json({
                success: true,
                message:
                    "Produk berhasil dihapus",
                data:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "Gagal menghapus produk:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal menghapus produk"
            });
        }
    }
);


// =====================================================
// CUSTOMER - PRODUK BERDASARKAN BISNIS
// =====================================================
app.get(
    "/api/businesses/:id/products",
    async (req, res) => {

        try {

            const businessId =
                Number(req.params.id);

            if (
                !Number.isInteger(businessId) ||
                businessId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "ID bisnis tidak valid"
                });
            }

            const businessResult =
                await pool.query(
                    `
                    SELECT id
                    FROM businesses
                    WHERE id = $1
                      AND verification_status = 'approved'
                    LIMIT 1
                    `,
                    [businessId]
                );

            if (
                businessResult.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Bisnis tidak ditemukan atau belum disetujui"
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        business_id,
                        name,
                        category,
                        description,
                        price,
                        stock,
                        status,
                        image_url,
                        created_at
                    FROM products
                    WHERE business_id = $1
                      AND status = 'active'
                      AND stock > 0
                    ORDER BY id DESC
                    `,
                    [businessId]
                );

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {

            console.error(
                "Gagal mengambil produk customer:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil produk bisnis"
            });
        }
    }
);


// ===============================
// SERVER
// ===============================
// ======================================================
// ORDER CUSTOMER
// ======================================================

app.post("/api/orders", async (req, res) => {
    const client = await pool.connect();

    try {
        const { business_id, customer_id = null, items } = req.body;

        if (!business_id) {
            return res.status(400).json({
                success: false,
                message: "Business ID wajib diisi"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Keranjang masih kosong"
            });
        }

        await client.query("BEGIN");

        // Ambil produk dari database
        const productIds = items.map(item => Number(item.product_id));

        const productsResult = await client.query(
            `
            SELECT id, business_id, name, price, stock, status
            FROM products
            WHERE id = ANY($1::int[])
              AND business_id = $2
            FOR UPDATE
            `,
            [productIds, business_id]
        );

        if (productsResult.rows.length !== productIds.length) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Ada produk yang tidak ditemukan atau bukan milik bisnis ini"
            });
        }

        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = productsResult.rows.find(
                p => p.id === Number(item.product_id)
            );

            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity <= 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Jumlah produk tidak valid"
                });
            }

            if (product.status !== "active") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: `Produk "${product.name}" tidak tersedia`
                });
            }

            if (product.stock < quantity) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: `Stok "${product.name}" tidak mencukupi`
                });
            }

            const price = Number(product.price);
            const subtotal = price * quantity;

            total += subtotal;

            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                price,
                quantity,
                subtotal
            });
        }

        // Buat order sementara
        const orderResult = await client.query(
            `
            INSERT INTO orders (
                business_id,
                customer_id,
                order_number,
                status,
                total
            )
            VALUES ($1, $2, $3, 'pending', $4)
            RETURNING id, business_id, customer_id, order_number, status, total, created_at
            `,
            [
                business_id,
                customer_id,
                `TEMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                total
            ]
        );

        const order = orderResult.rows[0];

        // Nomor order final
        const orderNumber = `SPC-${String(order.id).padStart(5, "0")}`;

        await client.query(
            `
            UPDATE orders
            SET order_number = $1
            WHERE id = $2
            `,
            [orderNumber, order.id]
        );

        // Simpan item pesanan
        for (const item of orderItems) {
            await client.query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    price,
                    quantity,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [
                    order.id,
                    item.product_id,
                    item.product_name,
                    item.price,
                    item.quantity,
                    item.subtotal
                ]
            );

            // Kurangi stok
            await client.query(
                `
                UPDATE products
                SET stock = stock - $1
                WHERE id = $2
                `,
                [item.quantity, item.product_id]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Pesanan berhasil dibuat",
            order: {
                id: order.id,
                order_number: orderNumber,
                business_id: order.business_id,
                status: order.status,
                total: total,
                created_at: order.created_at
            }
        });
} catch (error) {
    try {
        await client.query("ROLLBACK");
    } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
    }

    console.error("Create order error:", error);

    res.status(500).json({
        success: false,
        message: "Gagal membuat pesanan"
    });
} finally {
    client.release();
}
});

// ======================================================
// CEK STATUS PESANAN CUSTOMER
// ======================================================

app.get("/api/orders/:orderNumber/status", async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const businessId = Number(req.query.business_id);

        if (!orderNumber || !Number.isInteger(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Data pesanan tidak valid"
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                order_number,
                status,
                total,
                created_at
            FROM orders
            WHERE order_number = $1
              AND business_id = $2
            LIMIT 1
            `,
            [orderNumber, businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pesanan tidak ditemukan"
            });
        }

        res.json({
            success: true,
            order: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Check order status error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengecek status pesanan"
        });
    }
});
// ======================================================
// ORDER OWNER
// ======================================================

app.get("/api/owner/orders", authenticateOwner, async (req, res) => {
    try {
        if (!req.user.business_id) {
            return res.json({
                success: true,
                orders: []
            });
        }

        const ordersResult = await pool.query(
            `
            SELECT
                o.id,
                o.order_number,
                o.status,
                o.total,
                o.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'product_id', oi.product_id,
                            'product_name', oi.product_name,
                            'price', oi.price,
                            'quantity', oi.quantity,
                            'subtotal', oi.subtotal
                        )
                        ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi
                ON oi.order_id = o.id
            WHERE o.business_id = $1
            GROUP BY
                o.id,
                o.order_number,
                o.status,
                o.total,
                o.created_at
            ORDER BY o.created_at DESC
            `,
            [req.user.business_id]
        );

        res.json({
            success: true,
            orders: ordersResult.rows
        });

    } catch (error) {
        console.error("Get owner orders error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil pesanan"
        });
    }
});

// ======================================================
// UPDATE STATUS ORDER
// ======================================================

app.patch(
    "/api/owner/orders/:id/status",
    authenticateOwner,
    async (req, res) => {

        const client = await pool.connect();

        try {

            const orderId = Number(req.params.id);
            const { status } = req.body;

            const allowedStatus = [
                "pending",
                "processing",
                "completed",
                "cancelled"
            ];

            // Validasi ID
            if (!Number.isInteger(orderId) || orderId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID pesanan tidak valid"
                });
            }

            // Validasi status
            if (!allowedStatus.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status pesanan tidak valid"
                });
            }

            await client.query("BEGIN");

            // Ambil pesanan dan pastikan milik bisnis Owner
            const orderResult = await client.query(
                `
                SELECT
                    id,
                    order_number,
                    status,
                    total,
                    created_at
                FROM orders
                WHERE id = $1
                  AND business_id = $2
                FOR UPDATE
                `,
                [
                    orderId,
                    req.user.business_id
                ]
            );

            if (orderResult.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message: "Pesanan tidak ditemukan"
                });
            }

            const order = orderResult.rows[0];

            // Pesanan selesai tidak boleh diubah lagi
            if (order.status === "completed") {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Pesanan yang sudah selesai tidak dapat diubah"
                });
            }

            // Pesanan dibatalkan tidak boleh diubah lagi
            if (order.status === "cancelled") {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Pesanan yang sudah dibatalkan tidak dapat diubah"
                });
            }

            // Pending tidak boleh langsung selesai
            if (
                order.status === "pending" &&
                status === "completed"
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Pesanan pending harus diproses terlebih dahulu"
                });
            }

            // ==========================================
            // JIKA PESANAN DIBATALKAN
            // KEMBALIKAN STOK PRODUK
            // ==========================================

            if (status === "cancelled") {

                const itemsResult = await client.query(
                    `
                    SELECT
                        product_id,
                        quantity
                    FROM order_items
                    WHERE order_id = $1
                    `,
                    [orderId]
                );

                for (const item of itemsResult.rows) {

                    await client.query(
                        `
                        UPDATE products
                        SET stock = stock + $1
                        WHERE id = $2
                        `,
                        [
                            item.quantity,
                            item.product_id
                        ]
                    );
                }
            }

            // ==========================================
            // UPDATE STATUS PESANAN
            // ==========================================

            const updateResult = await client.query(
                `
                UPDATE orders
                SET status = $1
                WHERE id = $2
                RETURNING
                    id,
                    order_number,
                    status,
                    total,
                    created_at
                `,
                [
                    status,
                    orderId
                ]
            );

            await client.query("COMMIT");

            res.json({
                success: true,
                message:
                    "Status pesanan berhasil diperbarui",
                order: updateResult.rows[0]
            });

        } catch (error) {

            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }

            console.error(
                "Update order status error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Gagal memperbarui status pesanan"
            });

        } finally {

            client.release();

        }
    }
);
app.get("/api/owner/customers", authenticateOwner, async (req, res) => {
    try {
        if (!req.user.business_id) {
            return res.json({
                success: true,
                customers: [],
                stats: {
                    total: 0,
                    newCustomers: 0,
                    totalOrders: 0,
                    activeCustomers: 0
                }
            });
        }

        const result = await pool.query(
            `
            SELECT
                o.customer_id,
                COUNT(o.id)::int AS total_orders,
                SUM(o.total) AS total_spending,
                MAX(o.created_at) AS last_order
            FROM orders o
            WHERE o.business_id = $1
              AND o.customer_id IS NOT NULL
            GROUP BY o.customer_id
            ORDER BY MAX(o.created_at) DESC
            `,
            [req.user.business_id]
        );

        const customers = result.rows;

        const totalOrdersResult = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM orders
            WHERE business_id = $1
            `,
            [req.user.business_id]
        );

        const activeCustomersResult = await pool.query(
            `
            SELECT COUNT(DISTINCT customer_id)::int AS total
            FROM orders
            WHERE business_id = $1
              AND customer_id IS NOT NULL
              AND created_at >= NOW() - INTERVAL '30 days'
            `,
            [req.user.business_id]
        );

        const newCustomersResult = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM (
                SELECT customer_id
                FROM orders
                WHERE business_id = $1
                  AND customer_id IS NOT NULL
                GROUP BY customer_id
                HAVING MIN(created_at) >= NOW() - INTERVAL '30 days'
            ) AS new_customers
            `,
            [req.user.business_id]
        );

        res.json({
            success: true,
            customers,
            stats: {
                total: customers.length,
                newCustomers: newCustomersResult.rows[0].total,
                totalOrders: totalOrdersResult.rows[0].total,
                activeCustomers: activeCustomersResult.rows[0].total
            }
        });

    } catch (error) {
        console.error("Get owner customers error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data pelanggan"
        });
    }
});
app.get("/api/owner/statistics", authenticateOwner, async (req, res) => {
    try {
        if (!req.user.business_id) {
            return res.json({
                success: true,
                statistics: {
                    totalOrders: 0,
                    revenue: 0,
                    customers: 0,
                    activeProducts: 0,
                    pending: 0,
                    processing: 0,
                    completed: 0,
                    dailyOrders: []
                }
            });
        }

        const businessId = req.user.business_id;

        const result = await pool.query(
            `
            SELECT
                COUNT(*)::int AS total_orders,
              COALESCE(
    SUM(
        CASE
            WHEN status = 'completed'
            THEN total
            ELSE 0
        END
    ),
    0
) AS revenue,

                COUNT(*) FILTER (
                    WHERE status = 'pending'
                )::int AS pending,

                COUNT(*) FILTER (
                    WHERE status = 'processing'
                )::int AS processing,

                COUNT(*) FILTER (
                    WHERE status = 'completed'
                )::int AS completed,

                COUNT(DISTINCT customer_id) FILTER (
                    WHERE customer_id IS NOT NULL
                )::int AS customers

            FROM orders
            WHERE business_id = $1
            `,
            [businessId]
        );

        const productsResult = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM products
            WHERE business_id = $1
              AND status = 'active'
            `,
            [businessId]
        );

        const dailyResult = await pool.query(
            `
            SELECT
                DATE(created_at) AS order_date,
                COUNT(*)::int AS total
            FROM orders
            WHERE business_id = $1
              AND created_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
            `,
            [businessId]
        );

        res.json({
            success: true,
            statistics: {
                totalOrders: Number(result.rows[0].total_orders),
                revenue: Number(result.rows[0].revenue),
                customers: Number(result.rows[0].customers),
                activeProducts: Number(productsResult.rows[0].total),
                pending: Number(result.rows[0].pending),
                processing: Number(result.rows[0].processing),
                completed: Number(result.rows[0].completed),
                dailyOrders: dailyResult.rows
            }
        });

    } catch (error) {
        console.error("Get owner statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil statistik bisnis"
        });
    }
});
app.get("/api/owner/dashboard-summary", authenticateOwner, async (req, res) => {
    try {
        if (!req.user.business_id) {
            return res.json({
                success: true,
                dashboard: {
                    ordersToday: 0,
                    totalCustomers: 0,
                    totalProducts: 0,
                    revenueMonth: 0,
                    businessStatus: "Belum ada bisnis",
                    chart: [],
                    recentOrders: []
                }
            });
        }

        const businessId = req.user.business_id;

        // STATUS BISNIS
        const businessResult = await pool.query(
    `
    SELECT *
    FROM businesses
    WHERE id = $1
    LIMIT 1
    `,
    [businessId]
);

        // PESANAN HARI INI
        const ordersTodayResult = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM orders
            WHERE business_id = $1
              AND created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
            `,
            [businessId]
        );

        // TOTAL PELANGGAN
        const customersResult = await pool.query(
            `
            SELECT COUNT(DISTINCT customer_id)::int AS total
            FROM orders
            WHERE business_id = $1
              AND customer_id IS NOT NULL
            `,
            [businessId]
        );

        // PRODUK AKTIF
        const productsResult = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM products
            WHERE business_id = $1
              AND status = 'active'
            `,
            [businessId]
        );

        // PENDAPATAN BULAN INI
        const revenueResult = await pool.query(
            `
            SELECT COALESCE(
                SUM(
                    CASE
                        WHEN status != 'cancelled'
                        THEN total
                        ELSE 0
                    END
                ),
                0
            ) AS total
            FROM orders
            WHERE business_id = $1
              AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            `,
            [businessId]
        );

        // GRAFIK 7 HARI
        const chartResult = await pool.query(
            `
            SELECT
                DATE(created_at) AS order_date,
                COUNT(*)::int AS total
            FROM orders
            WHERE business_id = $1
              AND created_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
            `,
            [businessId]
        );

        // PESANAN TERBARU
        const recentOrdersResult = await pool.query(
            `
            SELECT
                id,
                order_number,
                status,
                total,
                created_at
            FROM orders
            WHERE business_id = $1
            ORDER BY created_at DESC
            LIMIT 5
            `,
            [businessId]
        );

        res.json({
            success: true,
            dashboard: {
                ordersToday: Number(
                    ordersTodayResult.rows[0].total
                ),

                totalCustomers: Number(
                    customersResult.rows[0].total
                ),

                totalProducts: Number(
                    productsResult.rows[0].total
                ),

                revenueMonth: Number(
                    revenueResult.rows[0].total
                ),

              businessStatus:
    businessResult.rows.length > 0
        ? (
            businessResult.rows[0].status ||
            businessResult.rows[0].verification_status ||
            "active"
        )
        : "pending",
                chart: chartResult.rows,

                recentOrders:
                    recentOrdersResult.rows
            }
        });

    } catch (error) {

        console.error(
            "Get dashboard summary error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dashboard"
        });

    }
});
app.listen(PORT, () => {
    console.log(
        `Server SPC berjalan di http://localhost:${PORT}`
    );
});