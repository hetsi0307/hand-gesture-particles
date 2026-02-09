const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// hidden canvas for text
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");
textCanvas.width = canvas.width;
textCanvas.height = canvas.height;

// video for hand tracking
const video = document.createElement("video");
video.style.display = "none";
document.body.appendChild(video);

// ================= CONFIG =================
let particles = [];
const GAP = 6;
const SIZE = 2;

// floating
let offsetX = 0;
let targetOffsetX = 0;

// wave mode
let currentMode = "NORMAL";
let time = 0;
let waveStrength = 0;

// gesture state
let lastShape = "";

// ================= PARTICLE =================
class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.tx = x;
        this.ty = y;
        this.size = SIZE;
        this.hue = Math.random() * 360;
    }

    update() {
        this.x += (this.tx - this.x) * 0.05;
        this.y += (this.ty - this.y) * 0.05;

        if (currentMode === "WAVE") {
            this.y += Math.sin((this.x + time) * 0.02) * waveStrength;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.hue},100%,70%)`;

        // ✨ glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsl(${this.hue},100%,70%)`;

        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ================= CREATE TEXT =================
function createText(text) {
    const targets = [];
    textCtx.clearRect(0, 0, canvas.width, canvas.height);

    textCtx.fillStyle = "white";
    textCtx.font = "bold 200px Arial";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText(text, canvas.width / 2, canvas.height / 2);

    const data = textCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let y = 0; y < canvas.height; y += GAP) {
        for (let x = 0; x < canvas.width; x += GAP) {
            if (data[(y * canvas.width + x) * 4 + 3] > 128) {
                targets.push({ x, y });
            }
        }
    }

    while (particles.length < targets.length) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    while (particles.length > targets.length) {
        particles.pop();
    }

    particles.forEach((p, i) => {
        p.tx = targets[i].x;
        p.ty = targets[i].y;
    });
}

// ================= ANIMATION =================
function animate() {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    offsetX += (targetOffsetX - offsetX) * 0.05;
    time += 1;

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// ================= HAND TRACKING =================
const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let lastHandX = null;

hands.onResults(results => {
    if (!results.multiHandLandmarks) return;

    const lm = results.multiHandLandmarks[0];

    // left / right floating
    const handX = lm[0].x;
    targetOffsetX = (handX - 0.5) * 300;

    // speed for wave strength
    if (lastHandX !== null) {
        const speed = Math.abs(handX - lastHandX);
        waveStrength = Math.min(speed * 200, 15);
    }
    lastHandX = handX;

    // finger count
    const fingers =
        (lm[8].y < lm[6].y) +
        (lm[12].y < lm[10].y) +
        (lm[16].y < lm[14].y) +
        (lm[20].y < lm[18].y);

    // ✊ FIST → LOVE
    if (fingers === 0 && lastShape !== "LOVE") {
        createText("LOVE");
        lastShape = "LOVE";
        currentMode = "NORMAL";
    }

    // ☝️ ONE FINGER → HETSI
    else if (fingers === 1 && lastShape !== "HETSI") {
        createText("HETSI");
        lastShape = "HETSI";
        currentMode = "NORMAL";
    }

    // ✌️ TWO FINGERS → HELLO
    else if (fingers === 2 && lastShape !== "HELLO") {
        createText("HELLO");
        lastShape = "HELLO";
        currentMode = "NORMAL";
    }

    // 🖐 OPEN PALM → WAVE
    else if (fingers >= 4) {
        currentMode = "WAVE";
    }
});

// camera
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});
camera.start();

// resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;
    createText(lastShape || "LOVE");
});

// start
createText("LOVE");
animate();
