import { z } from "zod";
export function registerBoardExploration(server) {
    server.prompt("board-exploration", "Interactively explore and understand an unfamiliar PCB design.", {
        pcb_file: z.string().describe("Path to .kicad_pcb file"),
        schematic_file: z.string().optional().describe("Path to .kicad_sch"),
    }, async ({ pcb_file, schematic_file }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please help me understand this PCB design.

**PCB file:** ${pcb_file}
${schematic_file ? `**Schematic file:** ${schematic_file}` : ""}

## Exploration Workflow

### Step 1: Board Overview
1. Read \`edith://board/${pcb_file}\` for board summary (dimensions, layer count, component count)
2. Read \`edith://board/${pcb_file}/layers\` for layer stackup
3. Read \`edith://board/${pcb_file}/design-rules\` for design constraints

### Step 2: Component Analysis
4. Read \`edith://board/${pcb_file}/footprints\` for the full component list
5. Group components by type:
   - **ICs / Microcontrollers** (QFP, BGA, QFN packages)
   - **Passive components** (resistors, capacitors, inductors)
   - **Connectors** (headers, USB, barrel jack, etc.)
   - **Power components** (regulators, inductors, MOSFETs)
   - **Other** (crystals, LEDs, test points, mounting holes)

### Step 3: Power Architecture
6. Read \`edith://board/${pcb_file}/nets\` for the net list
7. Identify power rails (VCC, VDD, 3V3, 5V, GND, etc.)
8. Trace power delivery: input connector → regulator → load

### Step 4: Visual Reference
9. Run \`render_pcb\` to generate a top-view image for visual context

${schematic_file ? `### Step 5: Schematic Context
10. Read \`edith://schematic/${schematic_file}\` for sheet hierarchy and component count` : ""}

### Summary
Provide a concise overview:
- **Board purpose** (inferred from key ICs and connectors)
- **Key ICs** with likely function
- **Interface connectors** (USB, SPI, I2C, UART, GPIO headers, etc.)
- **Power architecture** (input voltage, regulators, rails)
- **Board complexity** (layer count, component density, special features)`,
                },
            },
        ],
    }));
}
//# sourceMappingURL=board-exploration.js.map