---
description: "Design an active low-pass, high-pass, or band-pass filter"
argument-hint: "<filter_type> <cutoff_hz> [order]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `filter_type` (`$1`, required): Filter type: 'lowpass', 'highpass', or 'bandpass'
- `cutoff_hz` (`$2`, required): Cutoff frequency in Hz (e.g. '1000')
- `order` (`$3`, optional): Filter order: '1' or '2' (Sallen-Key)

Design an active $1 filter using SKiDL.

Requirements:
- Filter type: $1
- Cutoff frequency: $2 Hz
- Order: $3 (1st order or 2nd order Sallen-Key)

Steps:
1. Calculate component values:
   - 1st order: fc = 1/(2*pi*R*C)
   - 2nd order Sallen-Key: use equal-component design
2. Select standard R and C values
3. Create circuit with op-amp, resistors, and capacitors
4. Add power supply bypass capacitors
5. Wire according to filter topology
6. Run ERC and generate schematic

Consider: Q factor (for 2nd order), passband gain, component tolerance sensitivity, op-amp GBW requirements.
