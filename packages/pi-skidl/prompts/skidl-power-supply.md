---
description: "Design a linear or switching voltage regulator circuit"
argument-hint: "<regulator_type> <v_in> <v_out> <current_ma>"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `regulator_type` (`$1`, required): Type: 'linear' (LDO) or 'switching' (buck/boost)
- `v_in` (`$2`, required): Input voltage (e.g. '12')
- `v_out` (`$3`, required): Output voltage (e.g. '3.3')
- `current_ma` (`$4`, required): Max output current in mA (e.g. '500')

Design a $1 voltage regulator circuit using SKiDL.

Requirements:
- Type: $1
- Input: $2V → Output: $3V
- Max current: $4mA

For linear (LDO) regulator:
1. Select appropriate LDO (e.g. AMS1117-3.3, LM7805, MCP1700)
2. Add input cap (10µF), output cap (10µF), and optional 100nF ceramic bypass
3. Wire: VIN→input cap→regulator IN, regulator OUT→output cap→VOUT, GND connections

For switching (buck) regulator:
1. Select buck converter IC (e.g. LM2596, MP1584)
2. Add inductor (calculate L based on ripple requirements)
3. Add input/output caps, feedback resistors, bootstrap cap, Schottky diode
4. Wire per datasheet reference design

Run ERC, validate footprints, generate schematic and BOM.
