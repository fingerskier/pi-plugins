---
description: "Design a voltage level translation circuit"
argument-hint: "<v_low> <v_high> <channels> [direction]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `v_low` (`$1`, required): Low-side voltage (e.g. '3.3')
- `v_high` (`$2`, required): High-side voltage (e.g. '5')
- `channels` (`$3`, required): Number of channels (e.g. '4')
- `direction` (`$4`, optional): Direction: 'unidirectional' or 'bidirectional'

Design a logic level shifter circuit using SKiDL.

Requirements:
- Low side: $1V
- High side: $2V
- Channels: $3
- Direction: $4

Options:
A) MOSFET-based bidirectional (for I2C, open-drain):
   - BSS138 N-MOSFET per channel
   - Pull-up resistors on both sides (4.7k-10k)
   - Wire: gate to V_low, source to low-side signal, drain to high-side signal

B) Dedicated IC (simpler for many channels):
   - TXB0104 (bidirectional, 4-channel)
   - 74LVC245 (unidirectional, 8-channel)
   - Add bypass caps on both voltage rails

C) Resistor divider (unidirectional high→low only):
   - Two resistors per channel forming voltage divider

Select the appropriate approach and build the circuit.
Run ERC and generate schematic.
