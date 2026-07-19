(() => {
  "use strict";

  const SAMPLE_RATE = 44100;
  const MAX_UPLOAD_SECONDS = 20;

  const $ = (id) => document.getElementById(id);
  const state = {
    activeTab: "synthetic",
    rendered: null,
    uploaded: null,
    audioContext: null,
    sourceNode: null,
    startedAt: 0,
    animationFrame: null,
    deferredPrompt: null
  };

  const els = {
    tabs: [...document.querySelectorAll(".tab")],
    syntheticPanel: $("syntheticPanel"),
    uploadPanel: $("uploadPanel"),
    rpmStart: $("rpmStart"),
    rpmEnd: $("rpmEnd"),
    duration: $("duration"),
    turboTexture: $("turboTexture"),
    audioFile: $("audioFile"),
    fileName: $("fileName"),
    preset: $("preset"),
    extraLength: $("extraLength"),
    temperature: $("temperature"),
    shortGain: $("shortGain"),
    longGain: $("longGain"),
    rolloff: $("rolloff"),
    muffler: $("muffler"),
    reflection: $("reflection"),
    outputMode: $("outputMode"),
    durationOut: $("durationOut"),
    turboTextureOut: $("turboTextureOut"),
    extraLengthOut: $("extraLengthOut"),
    temperatureOut: $("temperatureOut"),
    shortGainOut: $("shortGainOut"),
    longGainOut: $("longGainOut"),
    rolloffOut: $("rolloffOut"),
    mufflerOut: $("mufflerOut"),
    reflectionOut: $("reflectionOut"),
    delayMetric: $("delayMetric"),
    speedMetric: $("speedMetric"),
    cancelMetric: $("cancelMetric"),
    responseCanvas: $("responseCanvas"),
    renderBtn: $("renderBtn"),
    playBtn: $("playBtn"),
    stopBtn: $("stopBtn"),
    exportBtn: $("exportBtn"),
    statusLabel: $("statusLabel"),
    statusDetail: $("statusDetail"),
    timeDisplay: $("timeDisplay"),
    installBtn: $("installBtn")
  };

  function number(el) {
    return Number(el.value);
  }

  function getParams() {
    const tempK = number(els.temperature) + 273.15;
    const gamma = 1.33;
    const gasConstant = 287;
    const waveSpeed = Math.sqrt(gamma * gasConstant * tempK);
    const delay = number(els.extraLength) / waveSpeed;

    return {
      rpmStart: Math.max(700, number(els.rpmStart)),
      rpmEnd: Math.max(800, number(els.rpmEnd)),
      duration: number(els.duration),
      turboTexture: number(els.turboTexture) / 100,
      extraLength: number(els.extraLength),
      temperature: number(els.temperature),
      waveSpeed,
      delay,
      shortGain: number(els.shortGain) / 100,
      longGain: number(els.longGain) / 100,
      rolloff: number(els.rolloff),
      muffler: number(els.muffler) / 100,
      reflection: number(els.reflection) / 100,
      outputMode: els.outputMode.value
    };
  }

  function updateOutputs() {
    const p = getParams();
    els.durationOut.value = `${p.duration.toFixed(0)} s`;
    els.turboTextureOut.value = `${Math.round(p.turboTexture * 100)}%`;
    els.extraLengthOut.value = `${p.extraLength.toFixed(2)} m`;
    els.temperatureOut.value = `${p.temperature.toFixed(0)} °C`;
    els.shortGainOut.value = `${Math.round(p.shortGain * 100)}%`;
    els.longGainOut.value = `${Math.round(p.longGain * 100)}%`;
    els.rolloffOut.value = p.rolloff >= 1000 ? `${(p.rolloff / 1000).toFixed(1)} kHz` : `${p.rolloff} Hz`;
    els.mufflerOut.value = `${Math.round(p.muffler * 100)}%`;
    els.reflectionOut.value = `${Math.round(p.reflection * 100)}%`;
    els.delayMetric.textContent = `${(p.delay * 1000).toFixed(2)} ms`;
    els.speedMetric.textContent = `${Math.round(p.waveSpeed)} m/s`;

    const firstCancellation = p.delay > 0 ? 1 / (2 * p.delay) : Infinity;
    els.cancelMetric.textContent = Number.isFinite(firstCancellation)
      ? `${Math.round(firstCancellation)} Hz`
      : "None";

    state.rendered = null;
    els.playBtn.disabled = true;
    els.exportBtn.disabled = true;
    setStatus("Design changed", "Render a new preview to hear the update.");
    drawResponse();
  }

  function setStatus(label, detail) {
    els.statusLabel.textContent = label;
    els.statusDetail.textContent = detail;
  }

  function applyPreset(name) {
    const presets = {
      subtle: {
        extraLength: 0.75,
        shortGain: 72,
        longGain: 28,
        rolloff: 3500,
        muffler: 35,
        reflection: 6
      },
      warble: {
        extraLength: 1.4,
        shortGain: 65,
        longGain: 42,
        rolloff: 2800,
        muffler: 28,
        reflection: 10
      },
      aggressive: {
        extraLength: 2.15,
        shortGain: 58,
        longGain: 50,
        rolloff: 4200,
        muffler: 18,
        reflection: 18
      }
    };
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => {
      els[key].value = value;
    });
    updateOutputs();
  }

  function drawResponse() {
    const canvas = els.responseCanvas;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 900;
    const cssHeight = Math.max(260, Math.round(cssWidth * 0.46));

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssWidth;
    const h = cssHeight;
    const pad = { l: 52, r: 18, t: 18, b: 38 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;
    const p = getParams();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, w, h);

    const minF = 20;
    const maxF = 5000;
    const minDb = -30;
    const maxDb = 6;

    const xForF = (f) => pad.l + (Math.log(f / minF) / Math.log(maxF / minF)) * plotW;
    const yForDb = (db) => pad.t + ((maxDb - db) / (maxDb - minDb)) * plotH;

    ctx.font = "11px system-ui";
    ctx.strokeStyle = "#292929";
    ctx.fillStyle = "#858585";
    ctx.lineWidth = 1;

    [20, 50, 100, 200, 500, 1000, 2000, 5000].forEach((f) => {
      const x = xForF(f);
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + plotH);
      ctx.stroke();
      ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x - 8, h - 14);
    });

    [-30, -20, -10, 0, 6].forEach((db) => {
      const y = yForDb(db);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.fillText(`${db}`, 17, y + 4);
    });

    const midpointRpm = (p.rpmStart + p.rpmEnd) / 2;
    const firingFrequency = midpointRpm / 20;
    ctx.save();
    ctx.strokeStyle = "#5d5d5d";
    ctx.setLineDash([5, 5]);
    for (let order = 1; order <= 8; order += 1) {
      const f = firingFrequency * order;
      if (f > maxF) break;
      const x = xForF(f);
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + plotH);
      ctx.stroke();
    }
    ctx.restore();

    const branchComplex = (f) => {
      const omega = 2 * Math.PI * f;
      const lpMagnitude = 1 / Math.sqrt(1 + Math.pow(f / p.rolloff, 2));
      const lpPhase = -Math.atan(f / p.rolloff);
      const phase = -(omega * p.delay) + lpPhase;
      const longAmp = p.longGain * lpMagnitude;
      let real = 0;
      let imag = 0;

      if (p.outputMode === "combined" || p.outputMode === "short") {
        real += p.shortGain;
      }
      if (p.outputMode === "combined" || p.outputMode === "long") {
        real += longAmp * Math.cos(phase);
        imag += longAmp * Math.sin(phase);
      }

      const mufflerCut = 1600 + (1 - p.muffler) * 6400;
      const mufflerMag = 1 / Math.sqrt(1 + Math.pow(f / mufflerCut, 2));
      const reflectionRipple = 1 + p.reflection * Math.cos(omega * p.delay * 1.75);
      const magnitude = Math.max(0.0001, Math.hypot(real, imag) * mufflerMag * reflectionRipple);
      return 20 * Math.log10(magnitude);
    };

    ctx.strokeStyle = "#f3f3f3";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const points = 520;
    for (let i = 0; i <= points; i += 1) {
      const ratio = i / points;
      const f = minF * Math.pow(maxF / minF, ratio);
      const db = Math.max(minDb, Math.min(maxDb, branchComplex(f)));
      const x = xForF(f);
      const y = yForDb(db);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "#8d8d8d";
    ctx.save();
    ctx.translate(12, pad.t + plotH / 2 + 18);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Relative level (dB)", 0, 0);
    ctx.restore();

    ctx.fillText("Frequency (Hz)", pad.l + plotW / 2 - 32, h - 3);
  }

  function makeSyntheticSource(params) {
    const length = Math.floor(params.duration * SAMPLE_RATE);
    const output = new Float32Array(length);
    let phase = 0;
    let filteredNoise = 0;

    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const progress = i / Math.max(1, length - 1);
      const shaped = progress * progress * (3 - 2 * progress);
      const rpm = params.rpmStart + (params.rpmEnd - params.rpmStart) * shaped;
      const firingHz = rpm / 20;
      phase += firingHz / SAMPLE_RATE;
      phase -= Math.floor(phase);

      const pulse = Math.exp(-42 * phase);
      const low = Math.sin(2 * Math.PI * phase);
      const h2 = Math.sin(4 * Math.PI * phase + 0.35);
      const h3 = Math.sin(6 * Math.PI * phase + 0.6);
      const h5 = Math.sin(10 * Math.PI * phase + 0.2);
      const engine = 0.82 * pulse + 0.22 * low + 0.18 * h2 + 0.11 * h3 + 0.07 * h5;

      const white = Math.random() * 2 - 1;
      filteredNoise += 0.035 * (white - filteredNoise);
      const spool = Math.pow(progress, 0.75);
      const turbo = filteredNoise * params.turboTexture * spool;

      const envelope = Math.min(1, t / 0.08) * Math.min(1, (params.duration - t) / 0.12);
      output[i] = (engine * 0.54 + turbo * 0.5) * envelope;
    }
    return output;
  }

  function onePoleLowPass(input, cutoff, sampleRate) {
    const out = new Float32Array(input.length);
    const dt = 1 / sampleRate;
    const rc = 1 / (2 * Math.PI * cutoff);
    const alpha = dt / (rc + dt);
    let y = 0;
    for (let i = 0; i < input.length; i += 1) {
      y += alpha * (input[i] - y);
      out[i] = y;
    }
    return out;
  }

  function onePoleMuffler(input, damping, sampleRate) {
    if (damping <= 0.001) return input.slice();
    const cutoff = 8000 - damping * 6100;
    return onePoleLowPass(input, cutoff, sampleRate);
  }

  function renderDualPath(source, params, sampleRate) {
    const delayedSamples = Math.max(0, Math.round(params.delay * sampleRate));
    const branchLong = onePoleLowPass(source, params.rolloff, sampleRate);
    const output = new Float32Array(source.length + delayedSamples + 4);

    for (let i = 0; i < source.length; i += 1) {
      if (params.outputMode === "combined" || params.outputMode === "short") {
        output[i] += source[i] * params.shortGain;
      }

      if (params.outputMode === "combined" || params.outputMode === "long") {
        const destination = i + delayedSamples;
        output[destination] += branchLong[i] * params.longGain;

        if (params.reflection > 0) {
          const reflectionDelay = delayedSamples + Math.max(1, Math.round(delayedSamples * 0.75));
          const reflectedDestination = i + reflectionDelay;
          if (reflectedDestination < output.length) {
            output[reflectedDestination] += branchLong[i] * params.longGain * params.reflection * -0.55;
          }
        }
      }
    }

    const muffled = onePoleMuffler(output, params.muffler, sampleRate);
    normalise(muffled, 0.92);
    return muffled;
  }

  function normalise(samples, target) {
    let peak = 0;
    for (let i = 0; i < samples.length; i += 1) {
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    if (peak < 1e-6) return samples;
    const gain = Math.min(4, target / peak);
    for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
    return samples;
  }

  async function ensureAudioContext() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }
    return state.audioContext;
  }

  async function decodeUpload(file) {
    const ctx = await ensureAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const maxFrames = Math.min(decoded.length, Math.floor(MAX_UPLOAD_SECONDS * decoded.sampleRate));
    const mono = new Float32Array(maxFrames);

    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let i = 0; i < maxFrames; i += 1) mono[i] += data[i] / decoded.numberOfChannels;
    }

    state.uploaded = {
      samples: mono,
      sampleRate: decoded.sampleRate,
      duration: maxFrames / decoded.sampleRate
    };
    setStatus("Recording loaded", `${file.name} · ${state.uploaded.duration.toFixed(1)} seconds`);
  }

  async function renderPreview() {
    try {
      stopPlayback();
      setStatus("Rendering", "Building the dual-path pressure-wave approximation…");
      els.renderBtn.disabled = true;

      const params = getParams();
      let source;
      let sampleRate;

      if (state.activeTab === "upload") {
        if (!state.uploaded) throw new Error("Choose an audio recording first.");
        source = state.uploaded.samples;
        sampleRate = state.uploaded.sampleRate;
      } else {
        source = makeSyntheticSource(params);
        sampleRate = SAMPLE_RATE;
      }

      await new Promise((resolve) => setTimeout(resolve, 35));
      const samples = renderDualPath(source, params, sampleRate);
      state.rendered = { samples, sampleRate, duration: samples.length / sampleRate };

      els.playBtn.disabled = false;
      els.exportBtn.disabled = false;
      setStatus("Preview ready", `${state.rendered.duration.toFixed(1)} seconds · ${params.outputMode} output`);
    } catch (error) {
      console.error(error);
      setStatus("Could not render", error.message || "Check the settings and try again.");
    } finally {
      els.renderBtn.disabled = false;
    }
  }

  async function playRendered() {
    if (!state.rendered) return;
    stopPlayback();

    const ctx = await ensureAudioContext();
    const buffer = ctx.createBuffer(1, state.rendered.samples.length, state.rendered.sampleRate);
    buffer.copyToChannel(state.rendered.samples, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (state.sourceNode === source) {
        state.sourceNode = null;
        cancelAnimationFrame(state.animationFrame);
        els.timeDisplay.textContent = formatTime(state.rendered.duration);
        els.stopBtn.disabled = true;
        els.playBtn.disabled = false;
        setStatus("Playback finished", "Change the design or export the WAV.");
      }
    };

    state.sourceNode = source;
    state.startedAt = ctx.currentTime;
    source.start();
    els.stopBtn.disabled = false;
    els.playBtn.disabled = true;
    setStatus("Playing", "Use headphones or a car speaker for easier A/B comparison.");
    tickTime();
  }

  function tickTime() {
    if (!state.sourceNode || !state.audioContext || !state.rendered) return;
    const elapsed = Math.min(state.rendered.duration, state.audioContext.currentTime - state.startedAt);
    els.timeDisplay.textContent = formatTime(elapsed);
    state.animationFrame = requestAnimationFrame(tickTime);
  }

  function stopPlayback() {
    if (state.sourceNode) {
      try { state.sourceNode.stop(); } catch (_) {}
      try { state.sourceNode.disconnect(); } catch (_) {}
      state.sourceNode = null;
    }
    cancelAnimationFrame(state.animationFrame);
    els.stopBtn.disabled = true;
    els.playBtn.disabled = !state.rendered;
    els.timeDisplay.textContent = "00:00";
  }

  function formatTime(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }

  function writeString(view, offset, text) {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  }

  function encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  function exportWav() {
    if (!state.rendered) return;
    const p = getParams();
    const blob = encodeWav(state.rendered.samples, state.rendered.sampleRate);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const length = p.extraLength.toFixed(2).replace(".", "_");
    a.href = url;
    a.download = `b58-dual-path-${length}m-${p.outputMode}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const next = tab.dataset.tab;
      state.activeTab = next;
      els.tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      els.syntheticPanel.classList.toggle("active", next === "synthetic");
      els.uploadPanel.classList.toggle("active", next === "upload");
      updateOutputs();
    });
  });

  const reactiveInputs = [
    els.rpmStart, els.rpmEnd, els.duration, els.turboTexture, els.extraLength,
    els.temperature, els.shortGain, els.longGain, els.rolloff, els.muffler,
    els.reflection, els.outputMode
  ];

  reactiveInputs.forEach((input) => {
    input.addEventListener("input", () => {
      els.preset.value = "custom";
      updateOutputs();
    });
  });

  els.preset.addEventListener("change", () => applyPreset(els.preset.value));

  els.audioFile.addEventListener("change", async () => {
    const file = els.audioFile.files && els.audioFile.files[0];
    if (!file) return;
    els.fileName.textContent = file.name;
    state.rendered = null;
    els.playBtn.disabled = true;
    els.exportBtn.disabled = true;
    try {
      setStatus("Loading recording", "Decoding audio locally in your browser…");
      await decodeUpload(file);
    } catch (error) {
      console.error(error);
      state.uploaded = null;
      setStatus("Could not load audio", "This file format may not be supported by your browser.");
    }
  });

  els.renderBtn.addEventListener("click", renderPreview);
  els.playBtn.addEventListener("click", playRendered);
  els.stopBtn.addEventListener("click", stopPlayback);
  els.exportBtn.addEventListener("click", exportWav);
  window.addEventListener("resize", drawResponse);

  if (els.installBtn) {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.deferredPrompt = event;
      els.installBtn.hidden = false;
    });

    els.installBtn.addEventListener("click", async () => {
      if (!state.deferredPrompt) return;
      state.deferredPrompt.prompt();
      await state.deferredPrompt.userChoice;
      state.deferredPrompt = null;
      els.installBtn.hidden = true;
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(console.error));
  }

  updateOutputs();
})();
