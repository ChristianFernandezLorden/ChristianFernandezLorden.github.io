/* The trace on the home page: a first-order High-Pass (HP) neuron, a sigmoid
 * in positive feedback with the high-pass filter τs / (τs + 1), integrated live.
 *
 *   ε dv/dt = −v + u(t) + σ(v) − x
 *   τ dx/dt = −x + σ(v)                        σ(v) = k tanh(v)
 *
 * x is the state of the low-pass filter from which the high-pass filter is
 * built, and ε ≪ τ is a fast lag on the sigmoid input v. The filter blocks DC,
 * so the resting point is v = u, x = σ(u): the input sets the operating point.
 * It is stable while σ'(u) < 1 + ε/τ, i.e. for |u| > 1.12 with the values
 * below. The page holds u = −1.6, just outside the spiking band.
 *
 * A click sends an impulse through a second-order low-pass filter
 * 1 / (τ_in s + 1)², and its response is added to the input:
 *
 *   u(t) = U_REST + A (t / τ_in) exp(1 − t / τ_in)
 *
 * It peaks at A when t = τ_in. The home page uses the starting values below;
 * in the note that explains the trace, two sliders set A and τ_in.
 * Clicks add up, because the filter is linear.
 *
 * The animation only runs while something is happening: once the trace is
 * flat again the loop stops, so an idle page costs nothing.
 */
(function () {
  "use strict";

  var button = document.querySelector(".trace");
  if (!button) return;
  var canvas = button.querySelector("canvas");
  var ctx = canvas.getContext("2d");

  // Model
  var K = 3;                // sigmoid gain: σ(v) = K tanh(v)
  var TAU = 20;             // time constant of the high-pass filter (slow)
  var EPS = 1;              // lag on the sigmoid input v (fast)
  var U_REST = -1.6;        // constant input
  var H = 0.02;             // Euler step
  var SAMPLE = 0.1;         // model time between stored points

  // Input pulse: starting values and slider ranges
  var amplitude = 1;                      // A, the peak of the pulse
  var timescale = 2;                      // τ_in, the time at which it peaks
  var AMP_MAX = 2;
  var TIME_MIN = 0.5, TIME_MAX = 20;      // the time slider is logarithmic

  function sigma(value) { return K * Math.tanh(value); }
  var V_REST = U_REST, X_REST = sigma(U_REST);

  // Display
  var SCROLL = 210;         // how fast the trace moves left, in pixels per second
  var TIME_PER_PX = 0.2;    // model time shown per pixel (smaller = wider spikes)
  var V_TOP = 5.5, V_BOTTOM = -4.8;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var v = V_REST, x = X_REST, t = 0;
  var s1 = 0, s2 = 0;                     // the two states of the input filter
  var lastSample = 0, lastActive = -1e9, carry = 0;
  var times = [], volts = [], inputs = [];
  var width = 0, height = 0, frame = 0, previous = 0;

  function advance(duration) {
    carry += duration;
    while (carry >= H) {
      carry -= H;
      var u = U_REST + s2;
      var s = sigma(v);
      var dv = (-v + u + s - x) / EPS;
      var dx = (-x + s) / TAU;
      var d1 = -s1 / timescale;
      var d2 = (s1 - s2) / timescale;
      v += H * dv;
      x += H * dx;
      s1 += H * d1;
      s2 += H * d2;
      t += H;
      if (Math.abs(s1) > 1e-3 || Math.abs(s2) > 1e-3 ||
          Math.abs(v - V_REST) > 2e-3 || Math.abs(x - X_REST) > 2e-3) lastActive = t;
      if (t - lastSample >= SAMPLE) { times.push(t); volts.push(v); inputs.push(U_REST + s2); lastSample = t; }
    }
    var oldest = t - width * TIME_PER_PX - 2;
    while (times.length && times[0] < oldest) { times.shift(); volts.shift(); inputs.shift(); }
  }

  function draw() {
    var style = getComputedStyle(button);
    var accent = style.getPropertyValue("--accent").trim() || "#C2255C";
    var muted = style.getPropertyValue("--muted").trim() || "#586279";

    var top = 6, bottom = height - 6;
    function x(time) { return width - (t - time) / TIME_PER_PX; }
    function y(value) { return top + ((V_TOP - value) / (V_TOP - V_BOTTOM)) * (bottom - top); }

    function line(values, now, colour, thickness) {
      ctx.beginPath();
      ctx.moveTo(0, y(V_REST));
      if (times.length) ctx.lineTo(Math.max(0, x(times[0])), y(V_REST));
      for (var i = 0; i < times.length; i++) ctx.lineTo(x(times[i]), y(values[i]));
      ctx.lineTo(width, y(now));
      ctx.strokeStyle = colour;
      ctx.lineWidth = thickness;
      ctx.stroke();
    }

    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // Input and response share one scale: at rest v = u, so the lines coincide.
    line(inputs, U_REST + s2, muted, 1);       // input u(t)
    line(volts, v, accent, 1.75);              // response v(t)
  }

  function idle() { return t - lastActive > width * TIME_PER_PX + 3; }

  function tick(now) {
    var elapsed = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    advance(elapsed * SCROLL * TIME_PER_PX);
    draw();
    frame = idle() ? 0 : requestAnimationFrame(tick);
  }

  function fire() {
    s1 += amplitude * Math.E;      // an impulse; e makes the response peak at `amplitude`
    lastActive = t;
    if (reduceMotion) {            // no animation: show the finished response at once
      advance(Math.min(110 + 4 * timescale, width * TIME_PER_PX * 0.8));
      draw();
      return;
    }
    if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
  }

  function resize() {
    var ratio = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  // Sliders (optional: the trace works without them)
  var controls = document.querySelector(".trace-controls");
  if (controls) {
    var ampSlider = controls.querySelector("[data-trace='amplitude']");
    var timeSlider = controls.querySelector("[data-trace='timescale']");
    var ampOut = controls.querySelector("[data-trace='amplitude-value']");
    var timeOut = controls.querySelector("[data-trace='timescale-value']");
    var span = Math.log(TIME_MAX / TIME_MIN);

    ampSlider.max = AMP_MAX;
    ampSlider.value = amplitude;
    timeSlider.value = Math.log(timescale / TIME_MIN) / span;

    var read = function () {
      amplitude = parseFloat(ampSlider.value);
      timescale = TIME_MIN * Math.exp(span * parseFloat(timeSlider.value));
      ampOut.textContent = amplitude.toFixed(2);
      timeOut.textContent = timescale < 10 ? timescale.toFixed(1) : timescale.toFixed(0);
    };
    controls.addEventListener("input", read);
    controls.addEventListener("change", fire);      // try the new setting straight away
    controls.addEventListener("submit", function (event) { event.preventDefault(); });
    read();
    controls.hidden = false;
  }

  button.addEventListener("click", fire);
  window.addEventListener("resize", resize);
  document.addEventListener("themechange", draw);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);

  resize();
  if (reduceMotion) fire(); else setTimeout(fire, 700);   // one spike to say hello
})();
