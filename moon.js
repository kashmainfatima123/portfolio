const canvas = document.getElementById("moonCanvas");
const ctx = canvas.getContext("2d");

const phaseInput = document.getElementById("phase");
const glowInput = document.getElementById("glow");
const sizeInput = document.getElementById("size");
const colorInput = document.getElementById("moonColor");

const phaseValue = document.getElementById("phaseValue");
const glowValue = document.getElementById("glowValue");
const sizeValue = document.getElementById("sizeValue");

const spinBtn = document.getElementById("spinBtn");
const exploreBtn = document.getElementById("exploreBtn");

let rotation = 0;
let phase = 0;
let glow = 5;
let moonSize = 100;
let moonColor = "#ff009e";

let spinning = true;
let dragging = false;
let lastX = 0;
let pulse = 0;
let hover = false;

let width = 0;
let height = 0;
let dpr = 1;

const TAU = Math.PI * 2;

// Deterministic random generator
function randomGenerator(seed) {
    return function () {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
}

const random = randomGenerator(42);

const craters = [];

for (let i = 0; i < 150; i++) {
    const lat = Math.asin(random() * 2 - 1);
    const lon = random() * TAU;

    craters.push({
        lat,
        lon,
        radius: 0.006 + random() * 0.025,
        depth: 0.3 + random() * 0.7
    });
}

// Resize canvas
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Convert hex color into RGB
function hexToRgb(hex) {
    const value = hex.replace("#", "");

    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16)
    };
}

// Mix moon color with a darker shade
function shadeColor(color, amount) {
    const rgb = hexToRgb(color);

    return `rgb(
        ${Math.round(rgb.r * amount)},
        ${Math.round(rgb.g * amount)},
        ${Math.round(rgb.b * amount)}
    )`;
}

// Draw background glow
function drawHalo(cx, cy, radius, time) {
    const breathing = 1 + Math.sin(time * 0.001) * 0.025;

    const halo = ctx.createRadialGradient(
        cx, cy, radius * 0.5,
        cx, cy, radius * 1.9 * breathing
    );

    halo.addColorStop(0, `rgba(255, 0, 158, ${glow / 40})`);
    halo.addColorStop(0.35, `rgba(255, 0, 158, ${glow / 70})`);
    halo.addColorStop(0.7, `rgba(255, 0, 158, ${glow / 160})`);
    halo.addColorStop(1, "rgba(255, 0, 158, 0)");

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2, 0, TAU);
    ctx.fill();
}

// Draw the moon's crater surface
function drawSurface(cx, cy, radius) {

    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.clip();

    const surface = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.08,
        cx,
        cy,
        radius
    );

    surface.addColorStop(0, "#fff0f8");
    surface.addColorStop(0.35, moonColor);
    surface.addColorStop(0.75, shadeColor(moonColor, 0.65));
    surface.addColorStop(1, shadeColor(moonColor, 0.25));

    ctx.fillStyle = surface;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fill();

    // Surface texture
    craters.forEach(crater => {

        let lon = crater.lon + rotation;

        lon = ((lon + Math.PI) % TAU + TAU) % TAU - Math.PI;

        const lat = crater.lat;

        const x3 = Math.cos(lat) * Math.sin(lon);
        const y3 = Math.sin(lat);
        const z3 = Math.cos(lat) * Math.cos(lon);

        // Hide the far side
        if (z3 < 0) return;

        const x = cx + x3 * radius;
        const y = cy - y3 * radius;

        const size = crater.radius * radius * 1.5;

        // Crater shadow
        const craterGradient = ctx.createRadialGradient(
            x - size * 0.25,
            y - size * 0.3,
            size * 0.05,
            x,
            y,
            size
        );

        craterGradient.addColorStop(
            0,
            `rgba(55, 0, 32, ${crater.depth * 0.35})`
        );

        craterGradient.addColorStop(
            0.65,
            `rgba(70, 0, 40, ${crater.depth * 0.2})`
        );

        craterGradient.addColorStop(
            0.9,
            `rgba(255, 210, 235, ${crater.depth * 0.35})`
        );

        craterGradient.addColorStop(
            1,
            "rgba(255, 255, 255, 0)"
        );

        ctx.fillStyle = craterGradient;

        ctx.beginPath();
        ctx.ellipse(
            x,
            y,
            size,
            size * 0.75,
            0,
            0,
            TAU
        );
        ctx.fill();
    });

    // Fine surface grain
    for (let i = 0; i < 700; i++) {
        const x = cx + (random() * 2 - 1) * radius;
        const y = cy + (random() * 2 - 1) * radius;

        const dx = x - cx;
        const dy = y - cy;

        if (dx * dx + dy * dy > radius * radius) continue;

        ctx.fillStyle = random() > 0.5
            ? "rgba(255,255,255,0.08)"
            : "rgba(35,0,25,0.09)";

        ctx.fillRect(x, y, 1.2, 1.2);
    }

    ctx.restore();
}

// Draw lunar phase shadow
function drawPhase(cx, cy, radius) {

    if (phase <= 0) return;

    const angle = phase * Math.PI / 180;
    const light = Math.cos(angle);

    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.clip();

    const shadow = ctx.createLinearGradient(
        cx - radius * 1.4,
        cy,
        cx + radius * 1.4,
        cy
    );

    if (light >= 0) {
        shadow.addColorStop(0, "rgba(0,0,0,0.96)");
        shadow.addColorStop(
            Math.max(0.01, 0.5 - light * 0.5),
            "rgba(0,0,0,0.95)"
        );
        shadow.addColorStop(
            Math.min(0.99, 0.5 + light * 0.5),
            "rgba(0,0,0,0)"
        );
        shadow.addColorStop(1, "rgba(0,0,0,0)");
    } else {
        shadow.addColorStop(0, "rgba(0,0,0,0)");
        shadow.addColorStop(
            Math.max(0.01, 0.5 + light * 0.5),
            "rgba(0,0,0,0)"
        );
        shadow.addColorStop(
            Math.min(0.99, 0.5 - light * 0.5),
            "rgba(0,0,0,0.95)"
        );
        shadow.addColorStop(1, "rgba(0,0,0,0.96)");
    }

    ctx.fillStyle = shadow;
    ctx.fillRect(
        cx - radius,
        cy - radius,
        radius * 2,
        radius * 2
    );

    // Spherical edge shading
    const edge = ctx.createRadialGradient(
        cx, cy, radius * 0.6,
        cx, cy, radius
    );

    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(0.85, "rgba(0,0,0,0.03)");
    edge.addColorStop(1, "rgba(0,0,0,0.5)");

    ctx.fillStyle = edge;
    ctx.fillRect(
        cx - radius,
        cy - radius,
        radius * 2,
        radius * 2
    );

    ctx.restore();
}

// White hot rim
function drawRim(cx, cy, radius) {

    const rim = ctx.createRadialGradient(
        cx, cy, radius * 0.91,
        cx, cy, radius
    );

    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(0.82, "rgba(255,190,225,0.1)");
    rim.addColorStop(0.95, "rgba(255,245,255,0.9)");
    rim.addColorStop(1, "rgba(255,255,255,0.05)");

    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.clip();

    ctx.fillStyle = rim;
    ctx.fillRect(
        cx - radius,
        cy - radius,
        radius * 2,
        radius * 2
    );

    ctx.restore();
}

// Click flare
function drawPulse(cx, cy, radius) {

    if (pulse <= 0) return;

    const distance = (1 - pulse) * radius * 1.5;

    ctx.save();

    ctx.globalAlpha = pulse * 0.7;
    ctx.strokeStyle = "#ffb8e2";
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        radius + distance,
        0,
        TAU
    );

    ctx.stroke();

    ctx.restore();
}

// Main rendering function
function drawMoon(time = 0) {

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const radius = Math.min(width, height) *
        0.32 * (moonSize / 100);

    drawHalo(cx, cy, radius, time);
    drawSurface(cx, cy, radius);
    drawPhase(cx, cy, radius);
    drawRim(cx, cy, radius);
    drawPulse(cx, cy, radius);

    if (hover) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 180, 225, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 8, 0, TAU);
        ctx.stroke();
        ctx.restore();
    }
}

// Animation loop
function animateMoon(time) {

    if (spinning && !dragging) {
        rotation += 0.0015;
    }

    if (pulse > 0) {
        pulse -= 0.012;
    }

    drawMoon(time);

    requestAnimationFrame(animateMoon);
}

requestAnimationFrame(animateMoon);

// Drag to rotate
canvas.addEventListener("pointerdown", e => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", e => {

    if (dragging) {
        const movement = e.clientX - lastX;

        rotation += movement * 0.008;
        lastX = e.clientX;
    }

    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    hover = Math.hypot(x, y) < rect.width * 0.32;
});

canvas.addEventListener("pointerup", () => {
    dragging = false;
});

canvas.addEventListener("pointercancel", () => {
    dragging = false;
});

canvas.addEventListener("pointerleave", () => {
    if (!dragging) hover = false;
});

// Phase control
phaseInput.addEventListener("input", () => {

    phase = Number(phaseInput.value);

    if (phase < 15) {
        phaseValue.textContent = "FULL MOON";
    } else if (phase < 75) {
        phaseValue.textContent = "GIBBOUS MOON";
    } else if (phase < 110) {
        phaseValue.textContent = "HALF MOON";
    } else {
        phaseValue.textContent = "CRESCENT MOON";
    }
});

// Glow control
glowInput.addEventListener("input", () => {

    glow = Number(glowInput.value);

    glowValue.textContent = glow + " / 10";
});

// Size control
sizeInput.addEventListener("input", () => {

    moonSize = Number(sizeInput.value);

    sizeValue.textContent = moonSize + "%";
});

// Colour control
colorInput.addEventListener("change", () => {

    moonColor = colorInput.value;
});

// Rotation button
spinBtn.addEventListener("click", () => {

    spinning = !spinning;

    spinBtn.textContent = spinning
        ? "PAUSE ROTATION"
        : "START ROTATION";
});

// Explore button
exploreBtn.addEventListener("click", () => {

    pulse = 1;

    document.querySelector(".controls").scrollIntoView({
        behavior: "smooth"
    });
});

// Click moon to create flare
canvas.addEventListener("click", () => {
    pulse = 1;
});