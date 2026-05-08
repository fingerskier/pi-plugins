---
description: "Design a 555 timer or crystal oscillator circuit"
argument-hint: "<osc_type> <frequency_hz>"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `osc_type` (`$1`, required): Oscillator type: '555_astable', '555_monostable', or 'crystal'
- `frequency_hz` (`$2`, required): Desired frequency in Hz (e.g. '1000' for 555, '16000000' for crystal)

Design a $1 oscillator circuit using SKiDL.

Requirements:
- Type: $1
- Frequency: $2 Hz

Steps for 555 astable:
1. Calculate R1, R2, C values: f = 1.44/((R1+2*R2)*C)
2. Add 555 timer IC, resistors, capacitors, bypass cap
3. Wire: VCC to pin 8, GND to pin 1, R1 from VCC to pin 7, R2 from pin 7 to pins 2&6, C from pins 2&6 to GND
4. Pin 4 (Reset) to VCC, Pin 5 (Control) via 10nF to GND

Steps for crystal oscillator:
1. Select crystal and load capacitors (C_load specified in crystal datasheet)
2. Calculate load caps: C1 = C2 = 2*C_load - C_stray (typically 5pF stray)
3. Add crystal, two load caps, feedback resistor (1M)
4. Wire Pierce oscillator topology

Run ERC and generate schematic.
