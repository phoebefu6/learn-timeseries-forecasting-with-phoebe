/* forecast-live.js - a REAL in-browser forecaster (learn-timeseries-forecasting-with-phoebe).
   Not a scripted sim: this computes actual forecasts on a synthetic Lumen daily-sessions series
   with real moving-average, simple exponential smoothing, seasonal-naive, and additive
   Holt-Winters (level + trend + weekly seasonality) recursions, draws the forecast line and an
   80% prediction interval, and recomputes MAPE + RMSE on a held-out horizon as you switch method
   and horizon. Methods that capture the weekly seasonality (seasonal-naive, Holt-Winters) beat the
   flat naive baseline - watch the error drop. Deterministic (no RNG).
   Honesty rail: real forecasting math on a small teaching series, not a production forecaster. */
(function () {
  var host = document.getElementById("forecast-live");
  if (!host) return;

  var M = 7;                 // weekly seasonality
  var N = 112;               // 16 weeks total
  var TRAIN = 84;            // 12 weeks history, 4 weeks held out
  var SEASON = [40, 55, 60, 50, 30, -120, -140];   // Mon..Sun shape (weekend dip)

  /* ---- build the series: level + trend + weekly seasonality + deterministic wiggle ---- */
  var y = [];
  for (var i = 0; i < N; i++) {
    var val = 1000 + 2.5 * i + SEASON[i % M] + (14 * Math.sin(i * 1.7) + 9 * Math.cos(i * 0.6));
    y.push(Math.round(val));
  }
  var train = y.slice(0, TRAIN);

  /* ---- helpers ---- */
  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  function std(a) { var m = mean(a); return Math.sqrt(mean(a.map(function (x) { return (x - m) * (x - m); }))); }

  /* ---- methods: each returns {fc:[h], resid:std of in-sample one-step errors} ---- */
  function naive(H) {
    var last = train[TRAIN - 1], fc = [];
    for (var h = 0; h < H; h++) fc.push(last);
    var e = []; for (var t = 1; t < TRAIN; t++) e.push(train[t] - train[t - 1]);
    return { fc: fc, resid: std(e) };
  }
  function movingAvg(H, w) {
    w = w || M;
    var base = mean(train.slice(TRAIN - w)), fc = [];
    for (var h = 0; h < H; h++) fc.push(base);
    var e = []; for (var t = w; t < TRAIN; t++) e.push(train[t] - mean(train.slice(t - w, t)));
    return { fc: fc, resid: std(e) };
  }
  function ses(H, alpha) {
    alpha = alpha || 0.4;
    var level = train[0], e = [];
    for (var t = 1; t < TRAIN; t++) { e.push(train[t] - level); level = alpha * train[t] + (1 - alpha) * level; }
    var fc = []; for (var h = 0; h < H; h++) fc.push(level);
    return { fc: fc, resid: std(e) };
  }
  function seasonalNaive(H) {
    var fc = [];
    for (var h = 1; h <= H; h++) fc.push(train[TRAIN - M + ((h - 1) % M)]);
    var e = []; for (var t = M; t < TRAIN; t++) e.push(train[t] - train[t - M]);
    return { fc: fc, resid: std(e) };
  }
  function holtWinters(H, alpha, beta, gamma) {
    alpha = alpha || 0.3; beta = beta || 0.05; gamma = gamma || 0.4;
    // init level = mean of first cycle, trend = avg cycle-over-cycle slope, seasonals = first cycle - level
    var level = mean(train.slice(0, M));
    var trend = (mean(train.slice(M, 2 * M)) - mean(train.slice(0, M))) / M;
    var season = []; for (var s = 0; s < M; s++) season[s] = train[s] - level;
    var e = [];
    for (var t = M; t < TRAIN; t++) {
      var si = t % M;
      var pred = level + trend + season[si];
      e.push(train[t] - pred);
      var lastLevel = level;
      level = alpha * (train[t] - season[si]) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      season[si] = gamma * (train[t] - level) + (1 - gamma) * season[si];
    }
    var fc = [];
    for (var h = 1; h <= H; h++) fc.push(level + h * trend + season[(TRAIN + h - 1) % M]);
    return { fc: fc, resid: std(e) };
  }

  var METHODS = [
    { id: "naive", label: "Naive", note: "Repeats the last value flat. Ignores the weekly pattern entirely - the baseline to beat.", fn: function (H) { return naive(H); } },
    { id: "ma", label: "Moving average", note: "Averages the last 7 days flat. Smooths noise but still misses the weekly shape and lags the trend.", fn: function (H) { return movingAvg(H, M); } },
    { id: "ses", label: "Exp. smoothing", note: "Simple exponential smoothing: a weighted memory of the past. Better level, still no seasonality.", fn: function (H) { return ses(H, 0.4); } },
    { id: "snaive", label: "Seasonal naive", note: "Repeats last week's same-weekday value. Captures the weekly pattern - a big jump in accuracy.", fn: function (H) { return seasonalNaive(H); } },
    { id: "hw", label: "Holt-Winters", note: "Level + trend + weekly seasonality, all updated recursively. Captures everything - the lowest error here.", fn: function (H) { return holtWinters(H); } }
  ];
  var HORIZONS = [7, 14, 28];
  var current = "naive", H = 14;

  /* ---- accuracy on the held-out horizon ---- */
  function evaluate(fc) {
    var ape = [], se = [];
    for (var h = 0; h < fc.length; h++) {
      var actual = y[TRAIN + h];
      ape.push(Math.abs(actual - fc[h]) / actual);
      se.push((actual - fc[h]) * (actual - fc[h]));
    }
    return { mape: mean(ape) * 100, rmse: Math.sqrt(mean(se)) };
  }

  /* ---- render shell ---- */
  host.innerHTML =
    '<div class="fl-shell">' +
      '<div class="fl-top">' +
        '<div class="fl-ctrl"><span class="fl-clabel">Method</span><div class="fl-methods"></div></div>' +
        '<div class="fl-ctrl"><span class="fl-clabel">Forecast horizon</span><div class="fl-horizons"></div></div>' +
      '</div>' +
      '<div class="fl-chart"><svg id="fl-svg" viewBox="0 0 860 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lumen daily sessions: history, forecast, and 80% prediction interval"></svg></div>' +
      '<div class="fl-legend">' +
        '<span><i class="fl-sw fl-hist"></i>History (train)</span>' +
        '<span><i class="fl-sw fl-act"></i>Actual (held out)</span>' +
        '<span><i class="fl-sw fl-fc"></i>Forecast</span>' +
        '<span><i class="fl-sw fl-band"></i>80% interval</span>' +
      '</div>' +
      '<div class="fl-meters">' +
        '<div class="fl-meter"><span class="fl-mlabel">MAPE (lower is better)</span><span class="fl-mval" id="fl-mape">-</span></div>' +
        '<div class="fl-meter"><span class="fl-mlabel">RMSE</span><span class="fl-mval" id="fl-rmse">-</span></div>' +
        '<div class="fl-meter fl-note" id="fl-note"></div>' +
      '</div>' +
      '<p class="fl-rail">Real forecasting math (moving average, exponential smoothing, seasonal-naive, and additive Holt-Winters recursions) computed live on a small synthetic Lumen series with an 80% prediction interval and held-out MAPE/RMSE - a teaching series, not a production forecaster. The lesson: methods that capture the weekly pattern beat the flat baseline.</p>' +
    '</div>';

  var mWrap = host.querySelector(".fl-methods");
  METHODS.forEach(function (m) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "fl-btn"; b.setAttribute("data-m", m.id); b.textContent = m.label;
    b.addEventListener("click", function () { current = m.id; render(); });
    mWrap.appendChild(b);
  });
  var hWrap = host.querySelector(".fl-horizons");
  HORIZONS.forEach(function (hz) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "fl-btn"; b.setAttribute("data-h", hz); b.textContent = hz + "d";
    b.addEventListener("click", function () { H = hz; render(); });
    hWrap.appendChild(b);
  });

  /* ---- draw ---- */
  var PAD_L = 46, PAD_R = 14, PAD_T = 16, PAD_B = 28, W = 860, HT = 320;
  var plotW = W - PAD_L - PAD_R, plotH = HT - PAD_T - PAD_B;

  function render() {
    var method = METHODS.filter(function (m) { return m.id === current; })[0];
    var r = method.fn(H);
    var ev = evaluate(r.fc);
    var z = 1.28;   // 80% interval

    // y-range across everything shown
    var shown = y.slice(0, TRAIN + H).slice();
    var lo = [], hi = [];
    for (var h = 0; h < H; h++) { var band = z * r.resid * Math.sqrt(h + 1); lo.push(r.fc[h] - band); hi.push(r.fc[h] + band); }
    var all = shown.concat(lo).concat(hi);
    var yMin = Math.min.apply(null, all), yMax = Math.max.apply(null, all);
    var pad = (yMax - yMin) * 0.08; yMin -= pad; yMax += pad;
    var nX = TRAIN + H;
    function X(i) { return PAD_L + (i / (nX - 1)) * plotW; }
    function Y(v) { return PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH; }

    var svg = "";
    // axes
    svg += '<line x1="' + PAD_L + '" y1="' + (PAD_T + plotH) + '" x2="' + (W - PAD_R) + '" y2="' + (PAD_T + plotH) + '" stroke="#CBD5E1" stroke-width="1"/>';
    svg += '<line x1="' + PAD_L + '" y1="' + PAD_T + '" x2="' + PAD_L + '" y2="' + (PAD_T + plotH) + '" stroke="#CBD5E1" stroke-width="1"/>';
    // y gridlines + labels (3)
    for (var g = 0; g <= 2; g++) {
      var gv = yMin + (yMax - yMin) * (g / 2);
      var gy = Y(gv);
      svg += '<line x1="' + PAD_L + '" y1="' + gy + '" x2="' + (W - PAD_R) + '" y2="' + gy + '" stroke="#E2E8F0" stroke-width="1"/>';
      svg += '<text x="' + (PAD_L - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font="400 11px Inter,sans-serif" fill="#64748B" style="font:400 11px Inter,sans-serif">' + Math.round(gv) + '</text>';
    }
    // "now" divider
    var nowX = X(TRAIN - 1);
    svg += '<line x1="' + nowX + '" y1="' + PAD_T + '" x2="' + nowX + '" y2="' + (PAD_T + plotH) + '" stroke="#94A3B8" stroke-width="1" stroke-dasharray="4 4"/>';
    svg += '<text x="' + (nowX + 4) + '" y="' + (PAD_T + 12) + '" style="font:600 11px Inter,sans-serif" fill="#64748B">forecast starts</text>';

    // prediction-interval band (polygon)
    var bandPts = "";
    for (var h = 0; h < H; h++) bandPts += X(TRAIN + h) + "," + Y(hi[h]) + " ";
    for (var h2 = H - 1; h2 >= 0; h2--) bandPts += X(TRAIN + h2) + "," + Y(lo[h2]) + " ";
    svg += '<polygon points="' + bandPts.trim() + '" fill="#BBF7D0" fill-opacity="0.55" stroke="none"/>';

    // history line (slate)
    var histPts = "";
    for (var i2 = 0; i2 < TRAIN; i2++) histPts += X(i2) + "," + Y(y[i2]) + " ";
    svg += '<polyline points="' + histPts.trim() + '" fill="none" stroke="#334155" stroke-width="2"/>';

    // actual held-out (dashed slate) - the truth we are scored against
    var actPts = X(TRAIN - 1) + "," + Y(y[TRAIN - 1]) + " ";
    for (var i3 = 0; i3 < H; i3++) actPts += X(TRAIN + i3) + "," + Y(y[TRAIN + i3]) + " ";
    svg += '<polyline points="' + actPts.trim() + '" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="5 4"/>';

    // forecast line (green) - connect from last history point
    var fcPts = X(TRAIN - 1) + "," + Y(y[TRAIN - 1]) + " ";
    for (var i4 = 0; i4 < H; i4++) fcPts += X(TRAIN + i4) + "," + Y(r.fc[i4]) + " ";
    svg += '<polyline points="' + fcPts.trim() + '" fill="none" stroke="#16A34A" stroke-width="2.5"/>';

    document.getElementById("fl-svg").innerHTML = svg;

    host.querySelectorAll(".fl-methods .fl-btn").forEach(function (b) { b.classList.toggle("fl-on", b.getAttribute("data-m") === current); });
    host.querySelectorAll(".fl-horizons .fl-btn").forEach(function (b) { b.classList.toggle("fl-on", +b.getAttribute("data-h") === H); });
    var mapeEl = document.getElementById("fl-mape");
    mapeEl.textContent = ev.mape.toFixed(1) + "%";
    mapeEl.className = "fl-mval" + (ev.mape < 4 ? " fl-good" : (ev.mape > 8 ? " fl-bad" : ""));
    document.getElementById("fl-rmse").textContent = Math.round(ev.rmse);
    document.getElementById("fl-note").innerHTML = "<b>" + method.label + "</b> " + method.note + " <span class=\"fl-h\">Scored on the next " + H + " days.</span>";
  }

  render();
})();
