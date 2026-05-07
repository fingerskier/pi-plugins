---
name: micropython
description: Work with MicroPython devices from Pi. Use when listing serial devices, connecting to boards, syncing files, executing code, backing up device filesystems, or running tests on Raspberry Pi Pico, ESP32, ESP8266, STM32, and similar boards.
---

# MicroPython Device Skill

Use the `micropython_*` Pi tools exposed by this package. They bridge the upstream MicroPython MCP server.

## Typical Flow

1. `micropython_list_devices` to find candidate serial ports.
2. `micropython_connect` with the selected port/baudrate.
3. Inspect with `micropython_device_info` and `micropython_list_files`.
4. Use read/write/upload/download/sync tools for file work.
5. Use execute/run tools for code, then interrupt/reset if needed.
6. `micropython_disconnect` when done.

## Safety

MicroPython tools affect physical devices. Ask before destructive operations such as delete, overwrite, flashing/pushing images, reset, or long-running hardware actions. Never bypass streaming, image, or path guardrails in the upstream server.
