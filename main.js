const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// hidden canvas
const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

textCanvas.width = canvas.width;
textCanvas.height = canvas.height;

let particles = [];
const GAP = 6;
const SIZE = 2;

// text list
const texts = ["LOVE", "HELLO", "HETSI"];
let textIndex = 0;

// GLOBAL OFFSET (THIS IS THE KEY)
let offsetX = 0;
let offsetY = 0;
let targetOffsetX = 0;
let targetOffsetY = 0;

// mouse as fake hand
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

window.addEventListener("mousemove", (e) => {
    // map mouse movement to offset
    targetOffsetX = (e.x - canvas.width / 2) * 0.05;
    targetOffsetY = (e.y - canvas.height / 2) * 0.05;
});

// Particle class
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
        ctx.arc(
            this.x + offsetX,
            this.y + offsetY,
            this.size,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "white";
        ctx.fill();
    }
}

// Create text
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

// animation
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // smooth floating
    offsetX += (targetOffsetX - offsetX) * 0.05;
    offsetY += (targetOffsetY - offsetY) * 0.05;

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// change text every 3s
setInterval(() => {
    textIndex = (textIndex + 1) % texts.length;
    createText(texts[textIndex]);
}, 3000);

// resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;
    createText(texts[textIndex]);
});

// start
createText(texts[textIndex]);
animate();
