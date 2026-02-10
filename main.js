const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// hidden video
const video = document.createElement("video");
video.style.display = "none";
document.body.appendChild(video);

// ===== STATE =====
let mode = "HELLO";   // DEFAULT
let posX = canvas.width / 2;

// ===== DRAW LOOP =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.lineWidth = 4;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (mode === "HELLO" || mode === "HETSI") {
    ctx.font = "80px Arial";
    ctx.fillText(mode, posX, canvas.height / 2);
  }

  if (mode === "SMILE") drawSmile();
  if (mode === "HEART") drawHeart();
  if (mode === "SATURN") drawSaturn();

  requestAnimationFrame(draw);
}
draw();

// ===== PATTERNS =====
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
  for (let t = 0; t < Math.PI * 2; t += 0.01) {
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
  ctx.ellipse(cx, cy, 100, 30, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// ===== HAND TRACKING =====
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

function countFingers(lm) {
  let c = 0;
  if (lm[8].y < lm[6].y) c++;
  if (lm[12].y < lm[10].y) c++;
  if (lm[16].y < lm[14].y) c++;
  if (lm[20].y < lm[18].y) c++;
  return c;
}

hands.onResults(res => {
  if (!res.multiHandLandmarks) return;
  const lm = res.multiHandLandmarks[0];

  // left-right move
  posX = lm[0].x * canvas.width;

  const fingers = countFingers(lm);

  // pinch detection (thumb + index)
  const pinch =
    Math.abs(lm[4].x - lm[8].x) < 0.05 &&
    Math.abs(lm[4].y - lm[8].y) < 0.05;

  if (pinch) mode = "HEART";
  else if (fingers === 0) mode = "SATURN";
  else if (fingers === 1) mode = "HETSI";
  else if (fingers === 2) mode = "HELLO";
  else if (fingers >= 4) mode = "SMILE";
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
