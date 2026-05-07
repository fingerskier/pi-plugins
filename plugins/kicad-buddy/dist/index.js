#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Tools
import { registerVerification } from "./tools/verification.js";
import { registerFabrication } from "./tools/fabrication.js";
import { registerInterchange } from "./tools/interchange.js";
import { registerPlotting } from "./tools/plotting.js";
import { registerModels } from "./tools/models.js";
import { registerLibrary } from "./tools/library.js";
import { registerJobsets } from "./tools/jobsets.js";
import { registerBoardEdit } from "./tools/board-edit.js";
import { registerBoardQuery } from "./tools/board-query.js";
import { registerTransactions } from "./tools/transactions.js";
import { registerSession } from "./tools/session.js";
// Resources
import { registerEnvironment } from "./resources/environment.js";
// Prompts
import { registerDesignReview } from "./prompts/design-review.js";
import { registerManufacturingPrep } from "./prompts/manufacturing-prep.js";
import { registerLibraryConversion } from "./prompts/library-conversion.js";
import { registerBoardExploration } from "./prompts/board-exploration.js";
import { registerModelExport } from "./prompts/model-export.js";
import { registerBoardSync } from "./prompts/board-sync.js";
import { registerProject } from "./resources/project.js";
import { registerBoard } from "./resources/board.js";
import { registerSchematic } from "./resources/schematic.js";
import { registerLibraries } from "./resources/libraries.js";
const server = new McpServer({
    name: "kicad_buddy",
    version: "0.1.0",
});
// Tools
registerVerification(server);
registerFabrication(server);
registerInterchange(server);
registerPlotting(server);
registerModels(server);
registerLibrary(server);
registerJobsets(server);
registerBoardEdit(server);
registerBoardQuery(server);
registerTransactions(server);
registerSession(server);
// Resources
registerEnvironment(server);
registerProject(server);
registerBoard(server);
registerSchematic(server);
registerLibraries(server);
// Prompts
registerDesignReview(server);
registerManufacturingPrep(server);
registerLibraryConversion(server);
registerBoardExploration(server);
registerModelExport(server);
registerBoardSync(server);
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Edith MCP server running on stdio");
}
main().catch((err) => {
    console.error("Failed to start Edith MCP server:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map