---
description: "Design an I2C bus with pull-ups and multiple device connections"
argument-hint: "<voltage> <devices> [speed]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `voltage` (`$1`, required): Bus voltage (e.g. '3.3' or '5')
- `devices` (`$2`, required): Comma-separated I2C devices (e.g. 'EEPROM,temp_sensor,RTC')
- `speed` (`$3`, optional): Bus speed: 'standard' (100kHz), 'fast' (400kHz), 'fast_plus' (1MHz)

Design an I2C bus circuit using SKiDL.

Requirements:
- Bus voltage: $1V
- Devices: $2
- Speed: $3 (affects pull-up values)

Steps:
1. Calculate pull-up resistor values:
   - Standard (100kHz): 4.7kΩ typical
   - Fast (400kHz): 2.2kΩ typical
   - Fast+ (1MHz): 1kΩ typical
   - Consider: R_pullup > V_bus / 3mA (I2C sink current limit)
2. Create SDA and SCL nets
3. Add pull-up resistors from SDA→VCC and SCL→VCC
4. Add each I2C device with its required support components
5. Add 100nF decoupling cap per device
6. Connect all devices' SDA pins to SDA net, SCL to SCL net
7. Add test points on SDA and SCL for debugging

Run ERC and generate schematic.
