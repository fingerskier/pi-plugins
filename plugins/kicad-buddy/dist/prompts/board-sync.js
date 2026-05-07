import { z } from "zod";
export function registerBoardSync(server) {
    server.prompt("refresh-board-state", "Refresh the agent's understanding of the live board state. Queries current state and diffs against previous snapshot.", {
        pcb_file: z.string().optional().describe("Path to .kicad_pcb (uses currently open board if omitted)"),
    }, async ({ pcb_file }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please refresh your understanding of the current board state.

## Workflow

1. Call \`get_board_state\`${pcb_file ? ` with file "${pcb_file}"` : ""} to get the current live state (footprints, tracks, nets, layers, design rules).
2. If you have a previous snapshot from an earlier call, compare the two and report:
   - **Added** items (new footprints, new tracks, new nets)
   - **Removed** items
   - **Changed** items (moved footprints, modified design rules, etc.)
3. If this is the first snapshot, provide a summary overview of the board state.
4. Store this snapshot as your current reference for future diffs.

Keep the summary concise — focus on what's new or changed.`,
                },
            },
        ],
    }));
    server.prompt("act-on-selection", "Read the current KiCad selection and offer actions on the selected items.", {
        pcb_file: z.string().optional().describe("Path to .kicad_pcb (uses currently open board if omitted)"),
    }, async ({ pcb_file }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `I've selected something in KiCad. Please read my selection and help me work with it.

## Workflow

1. Call \`get_selection\`${pcb_file ? ` with file "${pcb_file}"` : ""} to read the currently selected items.
2. If nothing is selected, let me know and suggest I select something first.
3. Describe what's selected — component references, net names, track segments, etc.
4. Based on what's selected, offer relevant actions:
   - **For footprints:** review placement, check clearances, suggest alignment, inspect properties
   - **For tracks:** check width vs. design rules, review routing, identify net
   - **For zones:** check fill, review net assignment, inspect clearance settings
   - **For mixed selection:** summarize the group, suggest grouping or alignment operations
5. Ask me what I'd like to do with the selection.`,
                },
            },
        ],
    }));
}
//# sourceMappingURL=board-sync.js.map