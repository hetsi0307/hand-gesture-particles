const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// hidden canvas for text pixels
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

textCanvas.width = canvas.width;
textCanvas.height = canvas.height;

// video for hand tracking
const video = document.createElement("video");
video.style.display = "none";
document.body.appendChild(video);

let particles = [];
const GAP = 6;
const SIZE = 2;

// floating offset
let offsetX = 0;
let targetOffsetX = 0;

// ================= PARTICLE CLASS =================
class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.tx = x;
        this.ty = y;
        this.size = SIZE;
    }

    update() {
        this.x += (this.tx - this.x) * 0.05;
        this.y += (this.ty - this.y) * 0.05;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
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
            const i = (y * canvas.width + x) * 4;
            if (data[i + 3] > 128) {
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

// ================= ANIMATION LOOP =================
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    offsetX += (targetOffsetX - offsetX) * 0.05;

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// ================= HAND TRACKING =================
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onHandResults);

// count fingers
function countFingers(landmarks) {
    let fingers = 0;

    if (landmarks[8].y < landmarks[6].y) fingers++;   // index
    if (landmarks[12].y < landmarks[10].y) fingers++; // middle
    if (landmarks[16].y < landmarks[14].y) fingers++; // ring
    if (landmarks[20].y < landmarks[18].y) fingers++; // pinky

    return fingers;
}

let lastGesture = "";

function onHandResults(results) {
    if (!results.multiHandLandmarks) return;

    const lm = results.multiHandLandmarks[0];

    // horizontal hand movement → floating
    const handX = lm[0].x; // wrist
    targetOffsetX = (handX - 0.5) * 300;

    const fingers = countFingers(lm);

    if (fingers === 0 && lastGesture !== "LOVE") {
        createText("LOVE");
        lastGesture = "LOVE";
    }

    if (fingers === 2 && lastGesture !== "HELLO") {
        createText("HELLO");
        lastGesture = "HELLO";
    }

    if (fingers === 1 && lastGesture !== "HETSI") {
        createText("HETSI");
        lastGesture = "HETSI";
    }
}

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
    createText(lastGesture || "LOVE");
});

// start
createText("LOVE");
animate();
