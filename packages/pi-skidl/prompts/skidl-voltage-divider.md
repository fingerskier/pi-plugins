---
description: "Design a resistive voltage divider circuit with ratio calculation"
argument-hint: "<v_in> <v_out> [current_ma]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `v_in` (`$1`, required): Input voltage (e.g. '12')
- `v_out` (`$2`, required): Desired output voltage (e.g. '3.3')
- `current_ma` (`$3`, optional): Desired divider current in mA (e.g. '1')

Design a resistive voltage divider circuit using SKiDL.

Requirements:
- Input voltage: $1V
- Desired output voltage: $2V
- Divider current: $3mA (if specified)

Steps:
1. Calculate R1 and R2 values using: Vout = Vin * R2/(R1+R2)
2. Select nearest standard resistor values (E24 series)
3. Create a circuit with create_circuit()
4. Add two resistors from the "Device" library with appropriate values and 0805 footprints
5. Create VIN, VOUT, and GND nets
6. Connect R1 between VIN and VOUT, R2 between VOUT and GND
7. Run ERC and generate schematic

Consider: power dissipation, tolerance effects on output accuracy, loading effects.
