# Model notes

## Source timing

For an evenly firing four-stroke six-cylinder engine, the firing-event rate is:

`f_fire = RPM × 6 / 120 = RPM / 20`

The physics source creates cylinder-synchronised pressure events rather than one continuous oscillator. In recording mode, synthetic timbre generation is bypassed.

## Exhaust network

Each component contributes a complex transfer `H(f)`:

- **Pipe:** hot-gas propagation phase and frequency-dependent wall/flow loss.
- **Bend:** equivalent arc length and additional loss.
- **Side resonator:** second-order tuned notch, including quarter-wave tuning from length.
- **Muffler:** delay, broadband attenuation and optional chamber resonance.
- **Valve:** opening-dependent restriction and low-pass behavior.
- **Tip:** outlet delay and approximate radiation behavior.

Parallel branches are combined as complex pressure contributions weighted by estimated conductance. For a recording made at the current tailpipe, the app applies:

`Y_proposed(f) = Y_recorded(f) × H_proposed(f) / H_current(f)`

The relative transfer is bounded so near-zero frequencies in the current layout cannot create unstable amplification.

## Comparison integrity

Current and proposed outputs share one linear gain reference. The tool does not independently peak-normalize each output. Optional loudness matching is explicitly selectable and the residual can be heard through the difference-only monitor.

## Research basis and boundary

The implementation direction follows pulse-train/resonator engine-sound research and established one-dimensional transfer-matrix modelling of exhaust and muffler elements. It is a lightweight browser approximation and does not copy external model weights or code. It is not a substitute for measured component matrices or a validated gas-dynamics model.
