const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// hidden canvas for text
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");
textCanvas.width = canvas.width;
textCanvas.height = canvas.height;

// video
const video = document.createElement("video");
video.style.display = "none";
document.body.appendChild(video);

let particles = [];
const GAP = 6;
const SIZE = 2;

// floating
let offsetX = 0;
let targetOffsetX = 0;

// modes
let currentMode = "NORMAL";
let time = 0;
let waveStrength = 0;

// ================= PARTICLE =================
class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = x;
        this.baseY = y;
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

        // ✨ GLOW
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsl(${this.hue},100%,70%)`;

        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ================= TEXT SHAPE =================
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

hands.onResults(res => {
    if (!res.multiHandLandmarks) return;

    const lm = res.multiHandLandmarks[0];

    // LEFT / RIGHT FLOAT
    const handX = lm[0].x;
    targetOffsetX = (handX - 0.5) * 300;

    // HAND SPEED → WAVE STRENGTH
    if (lastHandX !== null) {
        const speed = Math.abs(handX - lastHandX);
        waveStrength = Math.min(speed * 200, 15);
    }
    lastHandX = handX;

    // FINGER COUNT
    const fingers =
        (lm[8].y < lm[6].y) +
        (lm[12].y < lm[10].y) +
        (lm[16].y < lm[14].y) +
        (lm[20].y < lm[18].y);

    // MODE SWITCH
    if (fingers >= 4) currentMode = "WAVE";   // open palm
    if (fingers === 0) currentMode = "NORMAL"; // fist
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
    createText("LOVE");
});

// start
createText("LOVE");
animate();
