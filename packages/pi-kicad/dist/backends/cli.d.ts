import type { CliOptions, CliResult } from "./types.js";
export declare function getCliPath(): string;
export declare function runKicadCli(options: CliOptions): Promise<CliResult>;
export declare function checkCliAvailable(): Promise<boolean>;
export declare function getCliVersion(): Promise<string | null>;
/** Resolve a file path, making it absolute if relative */
export declare function resolveFile(file: string, cwd?: string): string;
