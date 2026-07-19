# B58 Dual-Path Exhaust Lab

A mobile-first, browser-based research prototype for comparing a conventional single exhaust route with a post-downpipe parallel short/long-path concept on a BMW B58.

## What changed in v2.1

The original synthetic preview used a generic pulse oscillator. Version 2.1 replaces it with a physics-informed pulse-train/resonator pipeline:

1. Six-cylinder, four-stroke event timing at the third engine order (`RPM / 20`).
2. Bipolar, cylinder-synchronised pressure pulses built from a decaying harmonic series.
3. Asymmetric pressure-release envelope and thermodynamic phase bending.
4. Pulse-synchronous broadband noise, turbulent modulation, mechanical orders and RPM/load-dependent flow noise.
5. Turbo smoothing before the proposed split.
6. Feedback delay-line resonators for the shared downpipe and each exhaust branch.
7. Branch impedance approximation using length, diameter and bend-equivalent length.
8. Hot-gas acoustic propagation delay, path loss, reflections and a selectable rear-section transfer.

The implementation is inspired by the Pulse-Train-Resonator (PTR) approach described by Robin Doerfler and Bob L. T. Wyse, and by established engine-order and exhaust transfer-path methods.

### Recording-mode correction

A tailpipe recording has already passed through the car's present exhaust transfer function. Applying another complete exhaust model would filter it twice and give a misleading result. Version 2.1 therefore transforms the recording in the frequency domain using an estimated relative transfer:

`Y_new(f) = Y_recorded(f) × H_dual(f) / H_single(f)`

The complex ratio preserves phase, is bounded between -18 dB and +9 dB for inverse stability, and is applied with a radix-2 FFT/IFFT. This is the most credible mode in the app because the real turbo, downpipe, tune, current exhaust, microphone and combustion timbre remain in the source recording.

## Accuracy boundaries

The physics mode should be used for:

- engine-order behaviour
- relative branch delay
- reinforcement/cancellation bands
- directional A/B comparisons between geometries

It is not an exact digital twin of a particular car. A phone or video recording also contains microphone response, automatic gain control, environmental reflections and compression.

For the most credible result, use **My B58 recording**. Exact installed sound still requires fabrication or a calibrated 1-D engine gas-dynamics model with measured source impedance, turbine transfer, gas temperature, branch losses and muffler data.

## Research references

- Doerfler, *Physics-Informed Neural Engine Sound Modeling with Differentiable Pulse-Train Synthesis*: https://arxiv.org/abs/2603.09391
- Open PRCE implementation: https://github.com/rdoerfler/prce-model
- SAE, *A Method of Synthesizing Exhaust Noises*: https://doi.org/10.4271/2001-01-0040
- SAE, *Flow Excited Noise Analysis of Exhaust Systems*: https://doi.org/10.4271/2002-01-0078
- SAE, *Exhaust Noise Development Based on System Models*: https://doi.org/10.4271/2005-01-2358

## Listening references

These are linked for qualitative listening only; their compressed audio is not embedded or copied into the simulator.

- Akrapovič A90 Supra official sound video: https://www.youtube.com/watch?v=SmFfPFGo-Tg
- AWE A90 exhaust suite and 180-degree cancellation explanation: https://www.awe-tuning.com/products/toyota-a90-supra-exhaust-suite
- A90 stock vs Supersprint comparison: https://www.youtube.com/watch?v=P8on-BOmHes

## Privacy

All generation, decoding and processing run in the browser. Uploaded audio is not sent to a server.

## Licence note

This repository does not copy PRCE model weights or source code. It implements a lightweight browser approximation of published concepts. PRCE itself is distributed under CC BY-NC 4.0; see its repository for its licence and attribution requirements.
