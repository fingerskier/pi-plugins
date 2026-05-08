---
description: "Design a microcontroller circuit with essential support components"
argument-hint: "<mcu> [clock_mhz] [interfaces]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `mcu` (`$1`, required): MCU part (e.g. 'ATmega328P-AU', 'STM32F103C8T6', 'ESP32-WROOM-32')
- `clock_mhz` (`$2`, optional): Clock frequency in MHz (e.g. '16')
- `interfaces` (`$3`, optional): Comma-separated interfaces to break out: 'uart,spi,i2c,gpio'

Design a microcontroller circuit with support components using SKiDL.

Requirements:
- MCU: $1
- Clock: $2MHz (if external crystal needed)
- Interfaces: $3

Essential support components:
1. Power supply decoupling:
   - 100nF ceramic cap on each VCC/VDD pin (as close as possible)
   - 10µF bulk cap near power input
2. Reset circuit:
   - 10k pull-up resistor to VCC
   - 100nF cap to GND (for noise filtering)
   - Optional reset button (tactile switch to GND)
3. Crystal/oscillator (if needed):
   - Crystal with load capacitors
   - See design_oscillator template for values
4. Programming header:
   - ISP/SWD/JTAG connector per MCU family
5. Status LED on a GPIO pin

Wire all power pins, add all decoupling caps, connect crystal, break out requested interfaces to headers.

Run ERC, validate footprints, generate schematic and BOM.
