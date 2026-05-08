---
description: "Design an H-bridge or MOSFET motor driver circuit"
argument-hint: "<motor_type> <voltage> <current_a>"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `motor_type` (`$1`, required): Motor type: 'dc_brushed', 'stepper', 'servo'
- `voltage` (`$2`, required): Motor supply voltage (e.g. '12')
- `current_a` (`$3`, required): Motor max current in amps (e.g. '2')

Design a motor driver circuit using SKiDL.

Requirements:
- Motor type: $1
- Supply voltage: $2V
- Max current: $3A

For DC brushed motor (H-bridge):
1. Select driver IC based on voltage/current:
   - <1A: L293D, DRV8833
   - 1-3A: L298N, DRV8871
   - >3A: Discrete MOSFET H-bridge (IRF540N + IRF9540N)
2. Add bulk decoupling caps (100µF electrolytic + 100nF ceramic)
3. Add flyback diodes (if not integrated): 1N4007 or Schottky
4. Wire: motor power, control inputs (PWM, DIR), enable
5. Add current sense resistor (optional, for feedback)

For stepper motor:
1. Select stepper driver (A4988, DRV8825, TMC2209)
2. Wire STEP, DIR, ENABLE pins
3. Add current-setting resistor per datasheet
4. Add decoupling on motor supply and logic supply

Run ERC, validate footprints, generate schematic and BOM.
