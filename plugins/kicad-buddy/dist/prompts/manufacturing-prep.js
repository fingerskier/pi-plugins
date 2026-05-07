import { z } from "zod";
export function registerManufacturingPrep(server) {
    server.prompt("manufacturing-prep", "Guide through preparing a design for PCB fabrication and assembly.", {
        pcb_file: z.string().describe("Path to .kicad_pcb file"),
        schematic_file: z.string().optional().describe("Path to .kicad_sch for BOM"),
        output_dir: z.string().describe("Where to write manufacturing files"),
        fab_house: z
            .string()
            .optional()
            .describe('Target fabrication house (e.g., "jlcpcb", "oshpark", "pcbway")'),
    }, async ({ pcb_file, schematic_file, output_dir, fab_house }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please prepare this design for PCB fabrication and assembly.

**PCB file:** ${pcb_file}
${schematic_file ? `**Schematic file:** ${schematic_file}` : ""}
**Output directory:** ${output_dir}
${fab_house ? `**Target fab house:** ${fab_house}` : ""}

## Manufacturing Prep Workflow

### Step 1: Pre-flight Check
1. Run \`run_drc\` on the PCB file — **block export if any errors remain**
2. Read \`edith://board/${pcb_file}\` for board summary (layer count, dimensions)

### Step 2: Export Fabrication Package
3. Run \`export_fabrication\` with:
   - file: "${pcb_file}"
   - output_dir: "${output_dir}"
   - drill_format: "excellon"
   - position_format: "csv"

### Step 3: Bill of Materials
${schematic_file ? `4. Run \`export_bom\` with:
   - file: "${schematic_file}"
   - output: "${output_dir}/bom.csv"
   - fields: ["Reference", "Value", "Footprint", "MPN", "Manufacturer"]
   - group_by: ["Value", "Footprint"]
   - exclude_dnp: true` : "4. (No schematic provided — skip BOM export)"}

### Step 4: Visual Verification
5. Run \`render_pcb\` for top view:
   - file: "${pcb_file}"
   - output: "${output_dir}/top_render.png"
   - rotate_x: 0, rotate_z: 0
6. Run \`render_pcb\` for bottom view:
   - file: "${pcb_file}"
   - output: "${output_dir}/bottom_render.png"
   - rotate_x: 180, rotate_z: 0

### Step 5: Manufacturing Notes
Generate a checklist covering:
- Layer count and stackup
- Board thickness
- Copper weight
- Surface finish (HASL, ENIG, OSP)
- Solder mask color
- Silkscreen color
- Impedance control requirements (if any)
- Minimum trace/space
- Minimum drill size
${fab_house ? `- Any ${fab_house}-specific requirements or capabilities` : ""}

### Step 6: File Manifest
List all generated files with their purpose and verify completeness.`,
                },
            },
        ],
    }));
}
//# sourceMappingURL=manufacturing-prep.js.map