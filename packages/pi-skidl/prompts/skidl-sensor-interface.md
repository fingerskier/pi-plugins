---
description: "Design an analog sensor input with signal conditioning for ADC"
argument-hint: "<sensor_type> <adc_voltage> [sensor_range]"
---

Use the `skidl_*` Pi tools to implement this circuit design. Create or select a circuit, add KiCad/SKiDL parts, wire nets, validate with ERC/connection/footprint checks, and generate useful outputs. Ask before overwriting project files.

Arguments:
- `sensor_type` (`$1`, required): Sensor type: 'thermistor', 'photodiode', 'strain_gauge', 'voltage'
- `adc_voltage` (`$2`, required): ADC reference voltage (e.g. '3.3')
- `sensor_range` (`$3`, optional): Sensor output range (e.g. '0-5V', '0-100mV', '10k-100k ohm')

Design an analog sensor interface with signal conditioning using SKiDL.

Requirements:
- Sensor type: $1
- ADC reference voltage: $2V
- Sensor range: $3

For thermistor (NTC):
1. Voltage divider with reference resistor (equal to R_25°C)
2. Optional: linearization network for improved accuracy
3. Filter cap (100nF) at ADC input

For voltage input:
1. Resistive divider to scale to ADC range
2. Op-amp buffer for high-impedance inputs
3. Anti-aliasing RC filter (fc = 10× sample rate)
4. TVS/Zener clamping diode for protection

For strain gauge:
1. Wheatstone bridge excitation
2. Instrumentation amplifier (e.g. INA128)
3. Low-pass filter
4. Reference voltage for bridge

Add ESD protection at connector/input, RC filter before ADC, and decoupling caps.
Run ERC and generate schematic.
