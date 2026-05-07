# Edith
Kicad MCP service

## Features
* Wraps KiCad's IPC API and provides MCP tools, resources and prompts
* Wraps KiCad's `kicad-cli`
  * manufacturing outputs ~ BOM, Netlist, Gerbers, etc.
  * DRC / ERC
  * Plots (2D) ~ PDF, Images
  * Models (3D) ~ STEP, STL, etc.
  * Footprints and symbols

## Usage
* Development
  * `cd <project-directory> && npm run dev` - start the development MCP server
* Production
  * `cd <project-directory> && npx edith` - start the production MCP server
* Requirements
  * `KICAD_PATH` environment variable pointing to the KiCad installation directory
