---
description: "Design a non-inverting or inverting op-amp amplifier circuit"
argument-hint: "<topology> <gain> [opamp]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `topology` (`$1`, required): Amplifier type: 'inverting' or 'non_inverting'
- `gain` (`$2`, required): Desired voltage gain (e.g. '10')
- `opamp` (`$3`, optional): Op-amp part number (e.g. 'LM358', 'OPA2134')

Design an op-amp amplifier circuit using SKiDL.

Requirements:
- Topology: $1
- Desired gain: $2x
- Op-amp: $3 (or suggest a suitable general-purpose op-amp)

Steps:
1. Calculate feedback resistor values:
   - Non-inverting: Gain = 1 + Rf/Rg
   - Inverting: Gain = -Rf/Rin
2. Select standard resistor values
3. Create circuit and add: op-amp, Rf (feedback resistor), Rg/Rin (gain-setting resistor)
4. Add bypass capacitors (100nF) on power pins
5. Create nets: VIN, VOUT, V+, V-, GND
6. Wire the circuit according to the topology
7. Run ERC and generate schematic

Consider: input/output impedance, bandwidth (GBW product), power supply requirements, input bias current effects.
