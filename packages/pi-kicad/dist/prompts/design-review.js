import { z } from "zod";
export function registerDesignReview(server) {
    server.prompt("design-review", "Comprehensive design review combining DRC/ERC results with manual checks.", {
        pcb_file: z.string().describe("Path to .kicad_pcb file"),
        schematic_file: z.string().optional().describe("Path to .kicad_sch for ERC + cross-checking"),
    }, async ({ pcb_file, schematic_file }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please perform a comprehensive design review of this PCB design.

**PCB file:** ${pcb_file}
${schematic_file ? `**Schematic file:** ${schematic_file}` : ""}

## Review Workflow

### Step 1: Automated Checks
1. Run \`run_drc\` on the PCB file with format "json" and severity_filter "all"
${schematic_file ? `2. Run \`run_erc\` on the schematic file with format "json" and severity_filter "all"` : ""}

### Step 2: Board Context
3. Read the \`edith://board/${pcb_file}\` resource for board summary
4. Read \`edith://board/${pcb_file}/design-rules\` for design rule settings
5. Read \`edith://board/${pcb_file}/footprints\` for the component list

### Step 3: Manual Checks
Review the collected data for:
- **Connectivity:** Unconnected nets, floating pins
- **Clearance:** Trace-to-trace, trace-to-pad, trace-to-edge clearances
- **Mechanical:** Missing courtyard, silkscreen overlapping pads, drill-to-edge distance
- **Power:** Bypass/decoupling capacitors placed near ICs, adequate trace widths for power nets, thermal relief on ground planes
- **Signal integrity:** Differential pair routing consistency, controlled impedance traces
- **Manufacturing:** Minimum annular ring, solder mask slivers, acid traps

### Step 4: Summary
Provide findings organized by severity (Error / Warning / Info) with:
- Location (component reference or coordinates)
- Description of the issue
- Recommended fix`,
                },
            },
        ],
    }));
}
//# sourceMappingURL=design-review.js.map