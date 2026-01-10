(() => {
  // --- DOM ---
  const canvas = document.getElementById("plot");
  const ctx = canvas.getContext("2d");

  const btnStart = document.getElementById("btnStart");
  const btnPause = document.getElementById("btnPause");
  const btnReset = document.getElementById("btnReset");

  const rateEl = document.getElementById("rate");
  const noiseEl = document.getElementById("noise");
  const rateVal = document.getElementById("rateVal");
  const noiseVal = document.getElementById("noiseVal");
  const statsEl = document.getElementById("stats");
  const trueAEl = document.getElementById("trueA");
  const trueBEl = document.getElementById("trueB");

  rateEl.addEventListener("input", () => (rateVal.textContent = rateEl.value));
  noiseEl.addEventListener("input", () => (noiseVal.textContent = Number(noiseEl.value).toFixed(2)));

  // --- Plot world coordinates ---
  const xMin = 0, xMax = 10;
  const yMin = -2, yMax = 12;

  const pad = 38;
  const W = canvas.width, H = canvas.height;

  const sx = x => pad + (x - xMin) / (xMax - xMin) * (W - 2 * pad);
  const sy = y => H - pad - (y - yMin) / (yMax - yMin) * (H - 2 * pad);

  // --- True model ---
  let trueM = 1.2;
  let trueB = 0.5;

  // --- Data + running sums for OLS ---
  let points = [];
  let n = 0, sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;

  // Standard normal via Box-Muller
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function applyTrueCoefficients(resetData) {
    const nextA = Number(trueAEl.value);
    const nextB = Number(trueBEl.value);
    if (Number.isFinite(nextA)) trueM = nextA;
    if (Number.isFinite(nextB)) trueB = nextB;
    if (resetData) {
      points = [];
      n = 0; sumX = 0; sumY = 0; sumXX = 0; sumXY = 0;
    }
    trueAEl.value = String(trueM);
    trueBEl.value = String(trueB);

    draw();
  }

  trueAEl.addEventListener("input", () => applyTrueCoefficients(true));
  trueBEl.addEventListener("input", () => applyTrueCoefficients(true));

  function reset() {
    points = [];
    n = 0; sumX = 0; sumY = 0; sumXX = 0; sumXY = 0;
    applyTrueCoefficients(false);
  }

  function addPoint() {
    const x = xMin + Math.random() * (xMax - xMin);
    const sigma = Number(noiseEl.value);
    const y = trueM * x + trueB + randn() * sigma;

    points.push({ x, y });

    n += 1;
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }

  function currentOLS() {
    if (n < 2) return { m: NaN, b: NaN };

    const denom = (n * sumXX - sumX * sumX);
    if (Math.abs(denom) < 1e-12) return { m: NaN, b: NaN };

    const m = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - m * sumX) / n;
    return { m, b };
  }

  // --- Drawing ---
  function drawAxes() {
    ctx.clearRect(0, 0, W, H);

    // Plot frame
    ctx.beginPath();
    ctx.rect(pad, pad, W - 2 * pad, H - 2 * pad);
    ctx.strokeStyle = "#c9c9c9";
    ctx.stroke();

    // Simple ticks
    ctx.fillStyle = "#666";
    ctx.font = "12px system-ui";

    for (let x = 0; x <= 10; x += 2) {
      ctx.fillText(String(x), sx(x) - 4, H - 12);
    }
    for (let y = -2; y <= 12; y += 2) {
      ctx.fillText(String(y), 10, sy(y) + 4);
    }
  }

  function drawLine(m, b, strokeStyle, width = 3) {
    if (!Number.isFinite(m) || !Number.isFinite(b)) return;

    const x1 = xMin, x2 = xMax;
    const y1 = m * x1 + b;
    const y2 = m * x2 + b;

    ctx.beginPath();
    ctx.moveTo(sx(x1), sy(y1));
    ctx.lineTo(sx(x2), sy(y2));
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawPoints() {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    drawAxes();

    // True line (blue-ish, translucent)
    drawLine(trueM, trueB, "rgba(0, 120, 255, 0.45)", 4);

    // Estimated OLS (pink/red-ish)
    const est = currentOLS();
    drawLine(est.m, est.b, "rgba(220, 0, 80, 0.85)", 4);

    // Points
    drawPoints();

    // Stats text
    statsEl.textContent =
      `n=${n}  |  true: y=${trueM.toFixed(3)}x + ${trueB.toFixed(3)}  |  ` +
      `est: y=${Number.isFinite(est.m) ? est.m.toFixed(3) : "—"}x + ${Number.isFinite(est.b) ? est.b.toFixed(3) : "—"}`;
  }

  // --- Simulation loop ---
  let timer = null;

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    const rate = Number(rateEl.value);
    const intervalMs = Math.max(10, Math.floor(1000 / rate));

    timer = setInterval(() => {
      addPoint();
      draw();
    }, intervalMs);
  }

  // --- Events ---
  btnStart.addEventListener("click", start);
  btnPause.addEventListener("click", stop);
  btnReset.addEventListener("click", () => { stop(); reset(); });

  // --- Init ---
  reset();
})();
