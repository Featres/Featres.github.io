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
  const statsEl = document.getElementById("stats");
  const trueAEl = document.getElementById("trueA");
  const trueBEl = document.getElementById("trueB");
  const fitCanvas = document.getElementById("fitPlot");
  const fitCtx = fitCanvas.getContext("2d");

  rateEl.addEventListener("input", () => (rateVal.textContent = rateEl.value));

  // --- Plot world coordinates ---
  const xMin = 0, xMax = 10;
  let yMin = -2, yMax = 12;

  const pad = 38;
  const W = canvas.width, H = canvas.height;
  const WF = fitCanvas.width, HF = fitCanvas.height;

  const sx = x => pad + (x - xMin) / (xMax - xMin) * (W - 2 * pad);
  const sy = y => H - pad - (y - yMin) / (yMax - yMin) * (H - 2 * pad);

  // --- True model ---
  let trueM = 2;
  let trueB = 1;

  // --- Data + running sums for OLS ---
  let points = [];
  let n = 0, sumX = 0, sumY = 0, sumXX = 0, sumXY = 0, sumYY = 0;
  let paramHistory = [];

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
      n = 0; sumX = 0; sumY = 0; sumXX = 0; sumXY = 0; sumYY = 0;
      paramHistory = [];
    }
    trueAEl.value = String(trueM);
    trueBEl.value = String(trueB);

    draw();
  }

  trueAEl.addEventListener("input", () => applyTrueCoefficients(true));
  trueBEl.addEventListener("input", () => applyTrueCoefficients(true));

  function reset() {
    points = [];
    n = 0; sumX = 0; sumY = 0; sumXX = 0; sumXY = 0; sumYY = 0;
    paramHistory = [];
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
    sumYY += y * y;

    const est = currentOLS();
    if (Number.isFinite(est.m) && Number.isFinite(est.b)) {
      paramHistory.push({ n, a: est.m, b: est.b });
    }
  }

  function computeYBounds() {
    const sigma = Number(noiseEl.value);
    const noisePad = Number.isFinite(sigma) ? 4 * sigma : 0;

    let minY = Infinity;
    let maxY = -Infinity;
    const include = value => {
      if (!Number.isFinite(value)) return;
      if (value < minY) minY = value;
      if (value > maxY) maxY = value;
    };

    include(trueM * xMin + trueB);
    include(trueM * xMax + trueB);

    if (points.length) {
      for (const p of points) include(p.y);
    }

    const est = currentOLS();
    if (Number.isFinite(est.m) && Number.isFinite(est.b)) {
      include(est.m * xMin + est.b);
      include(est.m * xMax + est.b);
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return { min: -2, max: 12 };
    }

    let span = maxY - minY;
    if (span < 1) span = 1;
    const padFrac = span * 0.15;
    return { min: minY - noisePad - padFrac, max: maxY + noisePad + padFrac };
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
  function formatTick(value, step) {
    if (step < 0.1) return value.toFixed(2);
    if (step < 1) return value.toFixed(1);
    return value.toFixed(0);
  }

  function drawAxes() {
    ctx.clearRect(0, 0, W, H);

    // Plot frame
    ctx.beginPath();
    ctx.rect(pad, pad, W - 2 * pad, H - 2 * pad);
    ctx.strokeStyle = "#c9c9c9";
    ctx.stroke();

    // Zero axes (dotted)
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "#8a8a8a";
    ctx.lineWidth = 1.5;
    if (xMin <= 0 && xMax >= 0) {
      const x0 = sx(0);
      const x0Adj = Math.min(Math.max(x0, pad + 1), W - pad - 1);
      ctx.beginPath();
      ctx.moveTo(x0Adj, pad);
      ctx.lineTo(x0Adj, H - pad);
      ctx.stroke();
    }
    if (yMin <= 0 && yMax >= 0) {
      const y0 = sy(0);
      const y0Adj = Math.min(Math.max(y0, pad + 1), H - pad - 1);
      ctx.beginPath();
      ctx.moveTo(pad, y0Adj);
      ctx.lineTo(W - pad, y0Adj);
      ctx.stroke();
    }
    ctx.restore();

    // Simple ticks
    ctx.fillStyle = "#666";
    ctx.font = "12px system-ui";

    for (let x = 0; x <= 10; x += 2) {
      ctx.fillText(String(x), sx(x) - 4, H - 12);
    }
    const ticks = 6;
    const step = (yMax - yMin) / (ticks - 1);
    for (let i = 0; i < ticks; i += 1) {
      const y = yMin + step * i;
      ctx.fillText(formatTick(y, step), 10, sy(y) + 4);
    }
  }

  function drawFitPlot() {
    fitCtx.clearRect(0, 0, WF, HF);

    const padF = 34;
    const xMinF = 0;
    const xMaxF = Math.max(n, 10);

    let minParam = Math.min(trueM, trueB);
    let maxParam = Math.max(trueM, trueB);
    for (const item of paramHistory) {
      if (item.a < minParam) minParam = item.a;
      if (item.b < minParam) minParam = item.b;
      if (item.a > maxParam) maxParam = item.a;
      if (item.b > maxParam) maxParam = item.b;
    }
    if (!Number.isFinite(minParam) || !Number.isFinite(maxParam)) {
      minParam = -1;
      maxParam = 1;
    }
    let span = maxParam - minParam;
    if (span < 1) span = 1;
    const padFrac = span * 0.2;
    const yMinF = minParam - padFrac;
    const yMaxF = maxParam + padFrac;

    const sxF = x => padF + (x - xMinF) / (xMaxF - xMinF) * (WF - 2 * padF);
    const syF = y => HF - padF - (y - yMinF) / (yMaxF - yMinF) * (HF - 2 * padF);

    fitCtx.beginPath();
    fitCtx.rect(padF, padF, WF - 2 * padF, HF - 2 * padF);
    fitCtx.strokeStyle = "#c9c9c9";
    fitCtx.stroke();

    fitCtx.fillStyle = "#666";
    fitCtx.font = "12px system-ui";
    fitCtx.fillText("n", WF - padF - 10, HF - 10);
    fitCtx.fillText("a/b", 8, padF - 8);

    for (let x = 0; x <= xMaxF; x += Math.ceil(xMaxF / 4)) {
      fitCtx.fillText(String(x), sxF(x) - 4, HF - 12);
    }

    const ticks = 5;
    const step = (yMaxF - yMinF) / (ticks - 1);
    for (let i = 0; i < ticks; i += 1) {
      const y = yMinF + step * i;
      fitCtx.fillText(formatTick(y, step), 6, syF(y) + 4);
    }

    // True a/b reference lines
    fitCtx.save();
    fitCtx.setLineDash([5, 5]);
    const yTrueA = syF(trueM);
    const yTrueB = syF(trueB);
    fitCtx.lineWidth = 2.5;
    fitCtx.strokeStyle = "rgba(20, 150, 90, 0.75)";
    fitCtx.beginPath();
    fitCtx.moveTo(padF, yTrueA);
    fitCtx.lineTo(WF - padF, yTrueA);
    fitCtx.stroke();
    fitCtx.strokeStyle = "rgba(230, 150, 30, 0.8)";
    fitCtx.beginPath();
    fitCtx.moveTo(padF, yTrueB);
    fitCtx.lineTo(WF - padF, yTrueB);
    fitCtx.stroke();
    fitCtx.setLineDash([]);
    fitCtx.fillStyle = "#666";
    fitCtx.font = "12px system-ui";
    fitCtx.fillText("true a", padF + 4, yTrueA - 6);
    fitCtx.fillText("true b", padF + 4, yTrueB - 6);
    fitCtx.restore();

    if (paramHistory.length < 2) return;

    fitCtx.beginPath();
    for (let i = 0; i < paramHistory.length; i += 1) {
      const { n: xn, a } = paramHistory[i];
      const x = sxF(xn);
      const y = syF(a);
      if (i === 0) fitCtx.moveTo(x, y);
      else fitCtx.lineTo(x, y);
    }
    fitCtx.strokeStyle = "rgba(20, 150, 90, 0.85)";
    fitCtx.lineWidth = 2;
    fitCtx.stroke();

    fitCtx.beginPath();
    for (let i = 0; i < paramHistory.length; i += 1) {
      const { n: xn, b } = paramHistory[i];
      const x = sxF(xn);
      const y = syF(b);
      if (i === 0) fitCtx.moveTo(x, y);
      else fitCtx.lineTo(x, y);
    }
    fitCtx.strokeStyle = "rgba(230, 150, 30, 0.9)";
    fitCtx.lineWidth = 2;
    fitCtx.stroke();
    fitCtx.lineWidth = 1;
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
    const bounds = computeYBounds();
    yMin = bounds.min;
    yMax = bounds.max;
    drawAxes();
    drawFitPlot();

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
