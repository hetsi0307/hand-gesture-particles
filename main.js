// ================= BASIC SETUP =================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// hidden video (required by MediaPipe)
const video = document.createElement("video");
video.style.display = "none";
document.body.appendChild(video);

// ================= STATE =================
let currentMode = "HELLO"; // DEFAULT
let posX = canvas.width / 2;

// ================= DRAW LOOP =================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.lineWidth = 4;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (currentMode === "HELLO" || currentMode === "HETSI") {
    ctx.font = "80px Arial";
    ctx.fillText(currentMode, posX, canvas.height / 2);
  }

  if (currentMode === "SMILE") drawSmile();
  if (currentMode === "SATURN") drawSaturn();
  if (currentMode === "HEART") drawHeart();

  requestAnimationFrame(draw);
}
draw();

// ================= PATTERNS =================
function drawSmile() {
  const cx = posX;
  const cy = canvas.height / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 40, cy - 40, 10, 0, Math.PI * 2);
  ctx.arc(cx + 40, cy - 40, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy + 20, 60, 0, Math.PI);
  ctx.stroke();
}

function drawHeart() {
  const cx = posX;
  const cy = canvas.height / 2;
  ctx.beginPath();
  for (let t = 0; t < Math.PI * 2; t += 0.02) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    ctx.lineTo(cx + x * 10, cy - y * 10);
  }
  ctx.stroke();
}

function drawSaturn() {
  const cx = posX;
  const cy = canvas.height / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, 110, 35, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// ================= MEDIAPIPE HANDS =================
const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// finger count
function countFingers(lm) {
  let count = 0;
  if (lm[8].y < lm[6].y) count++;   // index
  if (lm[12].y < lm[10].y) count++; // middle
  if (lm[16].y < lm[14].y) count++; // ring
  if (lm[20].y < lm[18].y) count++; // pinky
  return count;
}

hands.onResults(results => {
  if (!results.multiHandLandmarks) return;

  const lm = results.multiHandLandmarks[0];

  // move left / right
  posX = lm[0].x * canvas.width;

  const fingers = countFingers(lm);

  // pinch detection
  const pinch =
    Math.abs(lm[4].x - lm[8].x) < 0.05 &&
    Math.abs(lm[4].y - lm[8].y) < 0.05;

  if (pinch) {
    currentMode = "HEART";
  } else if (fingers === 0) {
    currentMode = "SATURN";
  } else if (fingers === 1) {
    currentMode = "HETSI";
  } else if (fingers === 2) {
    currentMode = "HELLO";
  } else if (fingers >= 4) {
    currentMode = "SMILE";
  }
});

// ================= CAMERA =================
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();
