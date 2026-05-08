---
description: "Design a Li-ion/LiPo battery charging circuit"
argument-hint: "<chemistry> <capacity_mah> [charge_current_ma]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `chemistry` (`$1`, required): Battery chemistry: 'li_ion' or 'lipo'
- `capacity_mah` (`$2`, required): Battery capacity in mAh (e.g. '2000')
- `charge_current_ma` (`$3`, optional): Charge current in mA (default: C/2 rate)

Design a $1 battery charger circuit using SKiDL.

Requirements:
- Chemistry: $1 (4.2V per cell)
- Battery capacity: $2mAh
- Charge current: $3mA (default: C/2 = $2/2 mA)

Steps:
1. Select charger IC (e.g. MCP73831 for single cell, TP4056 module)
2. Calculate programming resistor for charge current: Rprog per datasheet
3. Add components: charger IC, input cap, charge status LED(s), programming resistor
4. Add reverse polarity protection (optional: Schottky diode or P-MOSFET)
5. Wire per datasheet reference design
6. Add USB or barrel jack input connector

Run ERC, validate footprints, generate schematic and BOM.

Consider: thermal management, pre-charge/termination currents, battery protection (over-discharge, overcurrent).
