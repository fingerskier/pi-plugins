---
description: "Design an LED driver circuit with current limiting"
argument-hint: "<led_color> <v_supply> [num_leds] [current_ma]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `led_color` (`$1`, required): LED color: 'red', 'green', 'blue', 'white'
- `v_supply` (`$2`, required): Supply voltage (e.g. '5', '3.3')
- `num_leds` (`$3`, optional): Number of LEDs (series or parallel)
- `current_ma` (`$4`, optional): LED current in mA (default: 20)

Design an LED driver circuit using SKiDL.

Requirements:
- LED color: $1 (Vf: red≈1.8V, green≈2.2V, blue/white≈3.0V)
- Supply voltage: $2V
- Number of LEDs: $3 (default: 1)
- LED current: $4mA (default: 20mA)

Steps:
1. Calculate current-limiting resistor: R = (Vsupply - Vf) / I_led
2. Select nearest standard resistor value (round up for safety)
3. Verify power dissipation: P_R = I² × R (ensure < 1/4W for 0805)
4. Create circuit with LED(s) from Device library and resistor(s)
5. For multiple LEDs: series (higher voltage needed) or parallel (individual resistors)
6. Wire: VCC → R → LED anode, LED cathode → GND
7. Run ERC and generate schematic

Consider: thermal derating, forward voltage tolerance, dimming options (PWM-capable pin).
