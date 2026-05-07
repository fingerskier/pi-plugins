/**
 * Lightweight S-expression parser for KiCad files (.kicad_pcb, .kicad_sch).
 * Parses into a nested array structure for query traversal.
 */
export type SExprNode = string | SExprNode[];
export declare function parseSExpr(input: string): SExprNode[];
/**
 * Find all child lists whose first element matches the given tag.
 * Searches only immediate children of the given node.
 */
export declare function findByTag(node: SExprNode[], tag: string): SExprNode[][];
/**
 * Find the first child list matching the given tag, or null.
 */
export declare function findFirstByTag(node: SExprNode[], tag: string): SExprNode[] | null;
/**
 * Walk the tree depth-first, collecting all lists whose first element matches tag.
 */
export declare function findAllDeep(tree: SExprNode[], tag: string): SExprNode[][];
/**
 * Get the string value at a given index in an S-expr list, or undefined.
 */
export declare function strAt(node: SExprNode[], index: number): string | undefined;
/**
 * Extract a simple (tag value) property from a list.
 * e.g. from (footprint "R_0603" (at 10 20 90)), getProp(node, "at") => ["at", "10", "20", "90"]
 */
export declare function getProp(node: SExprNode[], tag: string): SExprNode[] | null;
