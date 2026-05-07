import { z } from "zod";
export function registerModelExport(server) {
    server.prompt("3d-model-export", "Guide through exporting 3D models for mechanical integration or visualization.", {
        pcb_file: z.string().describe("Path to .kicad_pcb file"),
        purpose: z
            .enum(["mechanical_integration", "visualization", "simulation"])
            .describe("Export purpose"),
    }, async ({ pcb_file, purpose }) => {
        const workflows = {
            mechanical_integration: `## Mechanical Integration Export

### Step 1: STEP Export
1. Run \`export_3d\` with:
   - file: "${pcb_file}"
   - format: "step"
   - include_tracks: true
   - include_pads: true
   - include_zones: true
   - include_silkscreen: false (reduces file size for CAD import)
   - include_soldermask: true

### Step 2: Verification Render
2. Run \`render_pcb\` with perspective view to verify 3D model completeness

### Step 3: Missing Models Check
3. Read \`edith://board/${pcb_file}/footprints\` to identify components
4. Flag any footprints likely missing 3D models (custom footprints, rare packages)

### Notes for CAD Import
- STEP files import into most mechanical CAD tools (Fusion 360, SolidWorks, FreeCAD)
- Board outline and mounting holes are critical for enclosure design
- Component heights matter for clearance analysis
- Coordinate origin is typically the board's auxiliary axis origin`,
            visualization: `## Visualization Export

### Step 1: High-Quality Renders
1. Run \`render_pcb\` — top perspective view:
   - quality: "high", width: 3200, height: 1800
   - rotate_x: 30, rotate_z: 15, perspective: true
2. Run \`render_pcb\` — bottom perspective view:
   - rotate_x: 210, rotate_z: 15
3. Run \`render_pcb\` — top orthographic view:
   - rotate_x: 0, rotate_z: 0, perspective: false

### Step 2: Web-Ready 3D Model
4. Run \`export_3d\` with format "glb" (binary glTF):
   - Ideal for web-based 3D viewers (three.js, model-viewer)
   - Include all visual elements (tracks, pads, silkscreen, soldermask)

### Step 3: Alternative Formats
5. Optionally export STL for 3D printing a display model
6. Optionally export VRML for embedded viewers with color information`,
            simulation: `## Simulation Export

### Step 1: FEA / Thermal Simulation
1. Run \`export_3d\` with format "brep" or "xao":
   - BREP: Native OpenCASCADE format for FreeCAD/GMSH
   - XAO: SALOME/Gmsh format with named groups for boundary conditions
   - Include tracks and zones (they carry heat)
   - Include pads (thermal vias are important)

### Step 2: Electromagnetic Simulation
2. Run \`export_3d\` with format "vrml":
   - VRML preserves material properties useful for EM tools
   - Include all copper features (tracks, pads, zones)

### Step 3: Board Context
3. Read \`edith://board/${pcb_file}\` for layer stackup info
4. Read \`edith://board/${pcb_file}/design-rules\` for trace widths and clearances

### Notes for Simulation Setup
- Layer stackup (copper thickness, dielectric constant) must be set in the simulation tool
- Board material is typically FR-4 (εr ≈ 4.5, tan δ ≈ 0.02)
- Standard copper thickness: 1 oz (35 μm) outer, 0.5 oz (17.5 μm) inner`,
        };
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please export 3D models from this PCB design for ${purpose.replace("_", " ")}.

**PCB file:** ${pcb_file}
**Purpose:** ${purpose}

${workflows[purpose]}`,
                    },
                },
            ],
        };
    });
}
//# sourceMappingURL=model-export.js.map