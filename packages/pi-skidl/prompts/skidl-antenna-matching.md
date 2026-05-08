---
description: "Design an impedance matching network for RF antenna"
argument-hint: "<frequency_mhz> <z_source> [topology]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `frequency_mhz` (`$1`, required): Operating frequency in MHz (e.g. '433', '915', '2400')
- `z_source` (`$2`, required): Source impedance in ohms (e.g. '50')
- `topology` (`$3`, optional): Matching network: 'pi', 'L', 'T'

Design an RF impedance matching network using SKiDL.

Requirements:
- Frequency: $1 MHz
- Source impedance: $2Ω
- Matching topology: $3

Steps:
1. Calculate matching component values using Smith chart or equations:
   - L-match: two reactive elements (L+C or C+L)
   - Pi-match: C-L-C (common for PA output)
   - T-match: L-C-L
2. Select standard inductor and capacitor values (from E12 series)
3. Use high-Q RF-rated components (NP0/C0G capacitors, air-core/chip inductors)
4. Create circuit with matching components
5. Add SMA or u.FL connector for antenna port
6. Add GND stitching vias (note in BOM/comments)

Run ERC and generate schematic.

Consider: component Q factor, self-resonant frequency (SRF > 2× operating frequency),
PCB layout parasitics, ground plane requirements.
