# B58 Exhaust Design Lab v3.1

A mobile-first browser workbench for designing and comparing BMW B58 / A90 Supra exhaust networks. It separates the engine recording from the exhaust transfer, supports component-level current and proposed layouts, renders current/proposed/difference audio with a shared gain reference, and includes an embedded DSP audit.

## What v3.1 adds

- Editable lanes for the current exhaust, proposed common section, parallel branches A/B and rear section.
- Pipes, bends, side resonators, mufflers, valves and tips with component-specific parameters.
- Hot-gas propagation, frequency-dependent loss, tuned notches, complex phase and conductance-weighted branch summation.
- Relative processing `H_proposed / H_current` for recordings made at the current tailpipe.
- FFT overlap-add audio processing.
- One shared linear A/B gain so geometry-induced changes are not hidden by separate normalization.
- Current, proposed and difference-only playback plus WAV and design-JSON export.
- Reference spectral calibration with best-checkpoint retention and regression rejection.
- Built-in 10-check DSP audit and an independent black-box mobile-browser audit.

## Audit status

The embedded DSP suite passes **10/10** and the black-box browser audit passes **7/7**. See [AUDIT_REPORT.md](AUDIT_REPORT.md) for the plan, failures found, fixes applied and remaining accuracy boundaries.

## Accuracy boundary

This is a one-dimensional plane-wave design model, not a calibrated GT-POWER replacement. Fabrication-grade prediction requires measured source impedance, mass flow, temperatures versus operating point, component transfer matrices, turbine/downpipe boundary conditions, microphone transfer and physical validation. The most credible workflow uses a clean recording of the actual car as the source.
