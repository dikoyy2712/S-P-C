document.addEventListener("DOMContentLoaded", () => {

    console.log("SPC — Sistem Pelayanan Customer");


    /* =========================================
       SMOOTH SCROLL
    ========================================= */

    document
        .querySelectorAll('a[href^="#"]')
        .forEach((link) => {

            link.addEventListener("click", (event) => {

                const targetId =
                    link.getAttribute("href");

                const target =
                    document.querySelector(targetId);

                if (!target) return;

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });

        });


    /* =========================================
       PARTICLE BACKGROUND
    ========================================= */

    const canvas =
        document.createElement("canvas");

    canvas.id = "particleCanvas";

    document.body.prepend(canvas);

    const ctx =
        canvas.getContext("2d");

    let particles = [];

    let mouse = {
        x: null,
        y: null
    };


    /* =========================================
       CANVAS SIZE
    ========================================= */

    function resizeCanvas() {

        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;

        createParticles();
    }


    /* =========================================
       CREATE PARTICLES
    ========================================= */

    function createParticles() {

        particles = [];

        const amount =
            Math.min(
                65,
                Math.floor(
                    window.innerWidth / 20
                )
            );

        for (let i = 0; i < amount; i++) {

            particles.push({

                x:
                    Math.random() *
                    canvas.width,

                y:
                    Math.random() *
                    canvas.height,

                size:
                    Math.random() * 1.7 + 0.5,

                speedX:
                    (Math.random() - 0.5) *
                    0.25,

                speedY:
                    (Math.random() - 0.5) *
                    0.25,

                opacity:
                    Math.random() * 0.55 +
                    0.15

            });

        }

    }


    /* =========================================
       MOUSE
    ========================================= */

    window.addEventListener(
        "mousemove",
        (event) => {

            mouse.x =
                event.clientX;

            mouse.y =
                event.clientY;

        }
    );


    window.addEventListener(
        "mouseleave",
        () => {

            mouse.x = null;
            mouse.y = null;

        }
    );


    /* =========================================
       DRAW PARTICLES
    ========================================= */

    function drawParticles() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        particles.forEach((particle) => {

            particle.x +=
                particle.speedX;

            particle.y +=
                particle.speedY;


            /* Screen wrapping */

            if (
                particle.x < -10
            ) {
                particle.x =
                    canvas.width + 10;
            }

            if (
                particle.x >
                canvas.width + 10
            ) {
                particle.x = -10;
            }

            if (
                particle.y < -10
            ) {
                particle.y =
                    canvas.height + 10;
            }

            if (
                particle.y >
                canvas.height + 10
            ) {
                particle.y = -10;
            }


            /* Mouse interaction */

            if (
                mouse.x !== null &&
                mouse.y !== null
            ) {

                const dx =
                    particle.x -
                    mouse.x;

                const dy =
                    particle.y -
                    mouse.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );

                if (distance < 130) {

                    particle.x +=
                        dx * 0.001;

                    particle.y +=
                        dy * 0.001;

                }

            }


            /* Particle */

            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(140, 120, 255, ${particle.opacity})`;

            ctx.fill();

        });


        requestAnimationFrame(
            drawParticles
        );

    }


    /* =========================================
       START
    ========================================= */

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    resizeCanvas();

    drawParticles();

});