import { z } from "zod";
export function registerLibraryConversion(server) {
    server.prompt("library-conversion", "Guide through converting component libraries from another EDA tool to KiCad format.", {
        source_path: z.string().describe("Path to source library files"),
        source_format: z
            .enum(["altium", "eagle", "easyeda", "cadstar", "geda"])
            .describe("Source EDA format"),
        output_dir: z.string().describe("Destination for converted libraries"),
    }, async ({ source_path, source_format, output_dir }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please convert these component libraries from ${source_format} to KiCad format.

**Source path:** ${source_path}
**Source format:** ${source_format}
**Output directory:** ${output_dir}

## Library Conversion Workflow

### Step 1: Identify Source Files
Examine the source path to identify:
- Schematic symbol libraries (${source_format === "altium" ? ".SchLib, .IntLib" : source_format === "eagle" ? ".lbr" : "library files"})
- PCB footprint libraries (${source_format === "altium" ? ".PcbLib, .IntLib" : source_format === "eagle" ? ".lbr" : "library files"})
- Any integrated libraries that contain both

### Step 2: Convert Footprints
For each footprint library found:
1. Run \`convert_library\` with type "footprint" and source_format "${source_format}"
2. Note any warnings or failures

### Step 3: Convert Symbols
For each symbol library found:
1. Run \`convert_library\` with type "symbol" and source_format "${source_format}"
2. Note any warnings or failures

### Step 4: Visual Verification
For a sample of converted footprints:
1. Run \`export_footprint_svg\` to generate SVGs
2. Review pad counts, courtyard sizes, and overall appearance

For a sample of converted symbols:
1. Run \`export_symbol_svg\` to generate SVGs
2. Review pin counts, names, and layout

### Step 5: Report
Provide a summary:
- Total libraries processed
- Successful conversions
- Warnings (may need manual review)
- Failures (could not convert)
- Recommended manual checks`,
                },
            },
        ],
    }));
}
//# sourceMappingURL=library-conversion.js.map