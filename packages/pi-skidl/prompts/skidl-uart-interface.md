---
description: "Design a UART/RS-232 or UART/USB level converter interface"
argument-hint: "<interface_type> <logic_voltage>"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `interface_type` (`$1`, required): Interface: 'rs232' or 'usb_serial'
- `logic_voltage` (`$2`, required): MCU logic voltage (e.g. '3.3' or '5')

Design a $1 UART interface using SKiDL.

Requirements:
- Interface type: $1
- Logic voltage: $2V

For RS-232:
1. Select MAX232 (5V) or MAX3232 (3.3V) level converter
2. Add charge pump capacitors (4× 100nF for MAX232, 4× 100nF for MAX3232)
3. Add DB9 connector
4. Wire: TX_TTL → T_IN → T_OUT → DB9, DB9 → R_IN → R_OUT → RX_TTL
5. Add ESD protection on DB9 connector lines

For USB-Serial:
1. Select USB-UART bridge IC (FT232RL, CH340G, CP2102)
2. Add USB Type-B/Micro-B/C connector
3. Add 27Ω series resistors on D+/D- (if not integrated)
4. Add ESD protection (USBLC6-2)
5. Add decoupling caps, ferrite bead on USB power
6. Optional: add TX/RX LEDs

Run ERC and generate schematic.
