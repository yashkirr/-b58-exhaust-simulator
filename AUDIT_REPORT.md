# B58 Exhaust Design Lab v3.1 — Independent Audit

## Objective

Test the tool as a separate QA agent whose job is to disprove that geometry affects audio, identify stale-state and normalization defects, verify mobile behavior, validate uploaded-recording processing, and reject a broken deployment.

## Audit plan

1. Load the app at 390×844 and desktop widths; capture console and page errors; check horizontal overflow.
2. Change long-branch length and diameter and measure transfer-function changes.
3. Add a 120 Hz side resonator and verify a notch at the intended frequency.
4. Process an order-rich signal and measure the current/proposed residual.
5. Verify one shared linear A/B gain and confirm geometry edits invalidate stale audio.
6. Upload a WAV through the visible interface, render `H_proposed/H_current`, play it and validate export.
7. Upload a reference WAV, run the fit loop, reject regressions and retain the best checkpoint.
8. Export and re-import design JSON.
9. Reconstruct the GitHub release and verify compressed and final HTML SHA-256 values before Pages deployment.

## Findings and fixes

### 1. v2.1 hid geometry changes

Current and proposed signals were peak-normalized independently. This could erase level differences and make layouts sound deceptively similar.

**Fix:** v3.1 uses a single shared linear gain. Loudness matching is optional and labelled. A difference-only monitor exposes the residual directly.

### 2. The old UI was not an exhaust designer

The previous build provided fixed sliders rather than a component network.

**Fix:** editable lanes now represent the current path, proposed common section, branch A, branch B and rear section. Pipes, bends, resonators, mufflers, valves and tips can be added, removed, reordered and edited.

### 3. The first v3 shared stage was still nonlinear

A `tanh` limiter slightly altered A/B ratios even with one shared gain.

**Fix:** the comparison gain is now linear. A numerical audit confirms that a 2:1 input ratio remains 2:1.

### 4. The first normalization test was invalid

The audit searched its own source text and could fail because the forbidden phrase appeared inside the test itself.

**Fix:** the audit now inspects the actual render path and separately verifies gain behavior numerically.

### 5. Reference fitting could drift backwards

The optimizer initially accepted later iterations even after the fit worsened.

**Fix:** it checkpoints the best EQ, rejects regressions, restores the best state and stops after repeated rejection.

### 6. The service worker referenced removed files

The standalone Pages release no longer includes separate CSS/JS assets, but the cache manifest still requested them.

**Fix:** v3.1 caches only the deployed root and `index.html`.

### 7. A large release upload was corrupted

The GitHub connector truncated one encoded payload.

**Fix:** the release is stored in sixteen small ordered segments. The workflow refuses deployment unless the reconstructed gzip and final HTML match the locally tested SHA-256 hashes.

## Final results

### Embedded DSP audit: 10/10

- Long-branch length: **3.03 dB mean**, **9.07 dB maximum** response change.
- Diameter: **1.90 dB mean**, **5.92 dB maximum** response change.
- 120 Hz resonator: **−4.3 dB to −10.5 dB** at the target.
- Processed test residual: **2.4 dB relative** to current output.
- Shared A/B ratio preserved.
- WAV header valid.
- Design JSON round-trip valid.
- Calibration fixture: **2.54 dB to 0.11 dB** log-spectral distance.
- Parallel flow weights finite.
- No independent output normalization in the render path.

### Black-box browser audit: 7/7

- Clean boot with no JavaScript errors.
- No horizontal overflow at 390 px.
- Embedded audit passed 10/10.
- Editing branch geometry invalidated stale audio.
- Long-path edit changed the rendered audio digest by `1.182e+05`.
- Uploaded recording produced a **−0.81 dB residual** relative to current.
- Calibration accepted improving checkpoints and retained the best score: `49.73 → 44.73 → 39.99 → 36.45 dB`.

## Remaining boundary

This remains a one-dimensional plane-wave model. Exact installed sound requires measured source impedance, mass flow and temperature by operating point, component transfer matrices, turbine/downpipe boundary conditions, microphone transfer and physical validation. Reference-video audio alone cannot provide those inputs.
