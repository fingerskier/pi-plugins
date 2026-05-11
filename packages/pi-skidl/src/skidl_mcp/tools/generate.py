"""MCP tools for generating circuit outputs: netlists, schematics, BOMs."""

from __future__ import annotations

import csv
import io
import json
import re
import tempfile
import time
from pathlib import Path

from skidl_mcp.circuit_manager import manager


_SAFE_STEM_RE = re.compile(r"[^A-Za-z0-9_.-]+")


def _safe_file_stem(name: str, fallback: str = "skidl") -> str:
    """Return a filesystem-safe stem suitable for SKiDL output basenames."""
    stem = _SAFE_STEM_RE.sub("_", str(name or "")).strip("._-")
    return stem or fallback


def _wait_for_stable_file(path: Path, timeout_s: float = 10.0, poll_s: float = 0.1) -> None:
    """Wait for an asynchronously-created output file to exist and stop growing."""
    deadline = time.monotonic() + timeout_s
    previous_size: int | None = None
    stable_count = 0

    while time.monotonic() < deadline:
        if path.exists():
            size = path.stat().st_size
            if size > 0 and size == previous_size:
                stable_count += 1
                if stable_count >= 2:
                    return
            else:
                stable_count = 0
            previous_size = size
        time.sleep(poll_s)

    raise TimeoutError(f"Timed out waiting for generated file: {path}")


def _read_text(path: Path) -> str:
    """Read UTF-8 text with a pragmatic fallback for generated EDA files."""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(errors="replace")


def generate_netlist() -> dict:
    """Generate a KiCad-compatible netlist for the active circuit.

    The netlist can be imported into KiCad's PCBNEW for PCB layout.

    Returns:
        Netlist content as text.
    """
    try:
        entry = manager.get_active()

        if not entry.parts:
            return {"status": "error", "message": "Circuit has no parts. Add parts before generating a netlist."}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".net", delete=False) as f:
            tmp_path = Path(f.name)

        try:
            # SKiDL's default do_backup=True writes skidl_sklib.py into the
            # process CWD. The plugin returns generated content directly, so
            # no backup library side-effect is needed here.
            entry.circuit.generate_netlist(file_=str(tmp_path), do_backup=False)
            netlist_content = _read_text(tmp_path)
        finally:
            if tmp_path.exists():
                tmp_path.unlink()

        return {
            "status": "ok",
            "format": "kicad_netlist",
            "content": netlist_content,
            "parts_count": len(entry.parts),
            "nets_count": len(entry.nets),
            "message": f"Netlist generated for circuit '{entry.name}' with {len(entry.parts)} parts and {len(entry.nets)} nets.",
        }
    except (RuntimeError, FileNotFoundError, OSError) as e:
        return {"status": "error", "message": str(e)}


def generate_svg() -> dict:
    """Generate an SVG schematic diagram of the active circuit.

    Returns:
        SVG content as a string that can be rendered as an image.
    """
    try:
        entry = manager.get_active()

        if not entry.parts:
            return {"status": "error", "message": "Circuit has no parts. Add parts before generating a schematic."}

        with tempfile.TemporaryDirectory(prefix="skidl-svg-") as td:
            basename = Path(td) / _safe_file_stem(entry.name, "schematic")
            svg_path = Path(str(basename) + ".svg")

            try:
                # SKiDL generate_svg(file_=...) expects a basename, not the
                # final .svg path. It writes <basename>.json,
                # <basename>_skin.svg, and launches netlistsvg to create
                # <basename>.svg asynchronously.
                entry.circuit.generate_svg(file_=str(basename))
                _wait_for_stable_file(svg_path)
            except FileNotFoundError as e:
                return {
                    "status": "error",
                    "message": (
                        "SVG generation requires the netlistsvg executable to be installed "
                        f"and on PATH. Original error: {e}"
                    ),
                }
            except TimeoutError as e:
                return {
                    "status": "error",
                    "message": (
                        f"{e}. Ensure netlistsvg is installed and that the circuit can be rendered."
                    ),
                }

            svg_content = _read_text(svg_path)

        return {
            "status": "ok",
            "format": "svg",
            "content": svg_content,
            "message": f"SVG schematic generated for circuit '{entry.name}'.",
        }
    except (RuntimeError, OSError) as e:
        return {"status": "error", "message": str(e)}


def generate_bom(output_format: str = "json") -> dict:
    """Generate a Bill of Materials (BOM) for the active circuit.

    Args:
        output_format: Output format - "json" for structured data, "csv" for spreadsheet-compatible.

    Returns:
        BOM listing all unique parts with quantities and details.
    """
    valid_formats = ("json", "csv")
    if output_format not in valid_formats:
        return {"status": "error", "message": f"Invalid format '{output_format}'. Must be one of: {', '.join(valid_formats)}."}

    try:
        entry = manager.get_active()

        if not entry.parts:
            return {"status": "error", "message": "Circuit has no parts. Add parts before generating a BOM."}

        # Group parts by (library, name, value, footprint)
        groups: dict[tuple, list[str]] = {}
        for ref, part in entry.parts.items():
            key = (
                str(getattr(part, "lib", "") or ""),
                part.name,
                str(getattr(part, "value", "") or ""),
                str(getattr(part, "footprint", "") or ""),
            )
            groups.setdefault(key, []).append(ref)

        bom_items = []
        for (lib, name, value, footprint), refs in groups.items():
            bom_items.append({
                "quantity": len(refs),
                "references": sorted(refs),
                "name": name,
                "value": value,
                "footprint": footprint,
                "library": lib,
            })

        # Sort by reference
        bom_items.sort(key=lambda x: x["references"][0])

        if output_format == "csv":
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(["Qty", "References", "Name", "Value", "Footprint", "Library"])
            for item in bom_items:
                writer.writerow([
                    item["quantity"],
                    " ".join(item["references"]),
                    item["name"],
                    item["value"],
                    item["footprint"],
                    item["library"],
                ])
            content = buf.getvalue()
        else:
            content = json.dumps(bom_items, indent=2)

        return {
            "status": "ok",
            "format": output_format,
            "content": content,
            "unique_parts": len(bom_items),
            "total_parts": len(entry.parts),
            "message": f"BOM generated: {len(bom_items)} unique parts, {len(entry.parts)} total.",
        }
    except (RuntimeError, KeyError) as e:
        return {"status": "error", "message": str(e)}


def generate_kicad_schematic() -> dict:
    """Generate a KiCad schematic file (.kicad_sch) for the active circuit.

    The schematic can be opened in KiCad's schematic editor (Eeschema).

    Returns:
        KiCad schematic file content.
    """
    try:
        entry = manager.get_active()

        if not entry.parts:
            return {"status": "error", "message": "Circuit has no parts. Add parts before generating a schematic."}

        with tempfile.TemporaryDirectory(prefix="skidl-kicad-sch-") as td:
            top_name = _safe_file_stem(entry.name, "schematic")
            expected_path = Path(td) / f"{top_name}.kicad_sch"

            # SKiDL generate_schematic() forwards kwargs to KiCad's generator,
            # which expects filepath/top_name rather than file_. Passing file_
            # is ignored and causes default skidl.kicad_sch CWD pollution.
            entry.circuit.generate_schematic(filepath=td, top_name=top_name)

            if expected_path.exists():
                content = _read_text(expected_path)
            else:
                generated = sorted(Path(td).glob("*.kicad_sch"))
                if not generated:
                    return {
                        "status": "error",
                        "message": f"KiCad schematic generation did not produce a .kicad_sch file in {td}.",
                    }
                content = _read_text(generated[0])

        return {
            "status": "ok",
            "format": "kicad_sch",
            "content": content,
            "message": f"KiCad schematic generated for circuit '{entry.name}'.",
        }
    except (RuntimeError, FileNotFoundError, OSError) as e:
        return {"status": "error", "message": str(e)}


def export_python() -> dict:
    """Export the active circuit as standalone SKiDL Python code.

    The generated code can be run independently to recreate the circuit.

    Returns:
        Python source code as a string.
    """
    try:
        entry = manager.get_active()

        if not entry.parts:
            return {"status": "error", "message": "Circuit has no parts."}

        lines = [
            "#!/usr/bin/env python3",
            f'"""SKiDL circuit: {entry.name}',
            f"",
            f"{entry.description}",
            f'"""',
            "",
            "from skidl import *",
            "",
            f"# Circuit: {entry.name}",
            "",
            "# --- Parts ---",
        ]

        # Emit part definitions
        for ref, part in entry.parts.items():
            var_name = ref.lower().replace(".", "_")
            lib = str(getattr(part, "lib", "Device") or "Device")
            value = str(getattr(part, "value", "") or "")
            footprint = str(getattr(part, "footprint", "") or "")
            args = [repr(lib), repr(part.name)]
            if value:
                args.append(f"value={repr(value)}")
            if footprint:
                args.append(f"footprint={repr(footprint)}")
            args.append(f"ref={repr(ref)}")
            lines.append(f"{var_name} = Part({', '.join(args)})")

        lines.append("")
        lines.append("# --- Nets ---")

        # Emit net definitions
        for name, net in entry.nets.items():
            var_name = name.lower().replace("+", "p").replace("-", "n").replace(".", "_")
            lines.append(f"{var_name} = Net({repr(name)})")

        lines.append("")
        lines.append("# --- Connections ---")

        # Emit connections
        for name, net in entry.nets.items():
            var_name = name.lower().replace("+", "p").replace("-", "n").replace(".", "_")
            for pin in net.pins:
                part_var = pin.part.ref.lower().replace(".", "_")
                lines.append(f"{var_name} += {part_var}[{repr(str(pin.num))}]  # {pin.name}")

        lines.append("")
        lines.append("# --- Generate outputs ---")
        lines.append("generate_netlist()")
        lines.append("")

        code = "\n".join(lines)

        return {
            "status": "ok",
            "format": "python",
            "content": code,
            "message": f"Python SKiDL code exported for circuit '{entry.name}'.",
        }
    except (RuntimeError, KeyError) as e:
        return {"status": "error", "message": str(e)}
