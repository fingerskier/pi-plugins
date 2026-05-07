/**
 * Lightweight S-expression parser for KiCad files (.kicad_pcb, .kicad_sch).
 * Parses into a nested array structure for query traversal.
 */
export function parseSExpr(input) {
    const tokens = tokenize(input);
    let pos = 0;
    function parseList() {
        const items = [];
        while (pos < tokens.length) {
            const token = tokens[pos];
            if (token === ")") {
                pos++;
                return items;
            }
            if (token === "(") {
                pos++;
                items.push(parseList());
            }
            else {
                pos++;
                items.push(token);
            }
        }
        return items;
    }
    const result = [];
    while (pos < tokens.length) {
        const token = tokens[pos];
        if (token === "(") {
            pos++;
            result.push(parseList());
        }
        else {
            pos++;
            result.push(token);
        }
    }
    return result;
}
function tokenize(input) {
    const tokens = [];
    let i = 0;
    const len = input.length;
    while (i < len) {
        const ch = input[i];
        // Skip whitespace
        if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
            i++;
            continue;
        }
        // Parentheses
        if (ch === "(" || ch === ")") {
            tokens.push(ch);
            i++;
            continue;
        }
        // Quoted string
        if (ch === '"') {
            let str = "";
            i++; // skip opening quote
            while (i < len && input[i] !== '"') {
                if (input[i] === "\\" && i + 1 < len) {
                    str += input[i + 1];
                    i += 2;
                }
                else {
                    str += input[i];
                    i++;
                }
            }
            i++; // skip closing quote
            tokens.push(str);
            continue;
        }
        // Atom (unquoted token)
        let atom = "";
        while (i < len && input[i] !== " " && input[i] !== "\t" && input[i] !== "\n" && input[i] !== "\r" && input[i] !== "(" && input[i] !== ")") {
            atom += input[i];
            i++;
        }
        tokens.push(atom);
    }
    return tokens;
}
/**
 * Find all child lists whose first element matches the given tag.
 * Searches only immediate children of the given node.
 */
export function findByTag(node, tag) {
    const results = [];
    for (const child of node) {
        if (Array.isArray(child) && child.length > 0 && child[0] === tag) {
            results.push(child);
        }
    }
    return results;
}
/**
 * Find the first child list matching the given tag, or null.
 */
export function findFirstByTag(node, tag) {
    for (const child of node) {
        if (Array.isArray(child) && child.length > 0 && child[0] === tag) {
            return child;
        }
    }
    return null;
}
/**
 * Walk the tree depth-first, collecting all lists whose first element matches tag.
 */
export function findAllDeep(tree, tag) {
    const results = [];
    function walk(nodes) {
        for (const node of nodes) {
            if (Array.isArray(node)) {
                if (node.length > 0 && node[0] === tag) {
                    results.push(node);
                }
                walk(node);
            }
        }
    }
    walk(tree);
    return results;
}
/**
 * Get the string value at a given index in an S-expr list, or undefined.
 */
export function strAt(node, index) {
    const val = node[index];
    return typeof val === "string" ? val : undefined;
}
/**
 * Extract a simple (tag value) property from a list.
 * e.g. from (footprint "R_0603" (at 10 20 90)), getProp(node, "at") => ["at", "10", "20", "90"]
 */
export function getProp(node, tag) {
    return findFirstByTag(node, tag);
}
//# sourceMappingURL=sexpr.js.map