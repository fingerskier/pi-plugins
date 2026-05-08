---
description: "Design an SPI bus with chip selects for multiple peripherals"
argument-hint: "<voltage> <num_devices> [devices]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `voltage` (`$1`, required): Bus voltage (e.g. '3.3')
- `num_devices` (`$2`, required): Number of SPI slave devices
- `devices` (`$3`, optional): Comma-separated device types (e.g. 'flash,display,ADC')

Design an SPI bus circuit using SKiDL.

Requirements:
- Bus voltage: $1V
- Number of slave devices: $2
- Devices: $3

Steps:
1. Create shared SPI nets: MOSI, MISO, SCK
2. Create individual CS (chip select) nets: CS0, CS1, ..., CS$2
3. Add pull-up resistors (10k) on each CS line (active low)
4. For each slave device:
   - Add the device IC
   - Add 100nF decoupling cap
   - Connect MOSI, MISO, SCK to shared bus
   - Connect individual CS line
5. Consider series resistors (33-100Ω) on MOSI/MISO/SCK for signal integrity
6. Add test points for debugging

Run ERC and generate schematic.

Consider: signal integrity at high speeds, CS timing, MISO tri-state behavior.
