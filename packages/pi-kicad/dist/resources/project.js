import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { resolveFile } from "../backends/cli.js";
export function registerProject(server) {
    server.resource("project-metadata", new ResourceTemplate("edith://project/{file}", { list: undefined }), {
        mimeType: "application/json",
        description: "Project title block, text variables, sheet structure, revision info",
    }, async (uri, variables) => {
        const file = resolveFile(String(variables.file));
        try {
            const raw = await readFile(file, "utf-8");
            const project = JSON.parse(raw);
            const info = {
                file,
            };
            // .kicad_pro is JSON — extract key sections
            if (project.text_variables)
                info.text_variables = project.text_variables;
            if (project.schematic)
                info.schematic = { path: project.schematic?.meta?.filename };
            if (project.board)
                info.board = { design_settings: !!project.board?.design_settings };
            if (project.libraries)
                info.libraries = project.libraries;
            if (project.net_settings)
                info.net_settings = !!project.net_settings;
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify(info, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: message }),
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=project.js.map