---
description: "Design a USB connector interface with ESD protection"
argument-hint: "<usb_type> <function> [voltage]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `usb_type` (`$1`, required): Connector: 'type_a', 'type_b', 'micro_b', 'type_c'
- `function` (`$2`, required): Function: 'power_only', 'data', 'otg'
- `voltage` (`$3`, optional): Logic voltage for data lines (e.g. '3.3')

Design a USB $1 interface circuit using SKiDL.

Requirements:
- Connector type: $1
- Function: $2
- Data logic voltage: $3V

Steps:
1. Add USB connector from Connector library
2. For Type-C: add CC resistors (5.1kΩ to GND for UFP/sink)
3. Add ESD protection IC (USBLC6-2SC6 or TPD2E2U06)
4. Add ferrite bead on VBUS for noise filtering
5. For data function:
   - 27Ω series resistors on D+/D- (USB 2.0 FS)
   - 1.5kΩ pull-up on D+ (for device mode, full speed)
6. Add bulk cap on VBUS (10µF + 100nF)
7. Optional: VBUS power switch IC for host mode

Run ERC, validate footprints, generate schematic and BOM.

Consider: USB spec compliance, impedance matching for high-speed, shield grounding.
