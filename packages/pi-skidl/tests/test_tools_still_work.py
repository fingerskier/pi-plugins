"""Verify SKiDL MCP tools still operate after the log-file cleanup.

The cleanup in ``skidl_mcp/__init__.py`` detaches SKiDL's file handlers.
This must not break the SKiDL machinery itself -- circuit lifecycle and
logging-aware operations like ERC should still complete cleanly without
re-creating ``skidl.log`` / ``skidl.erc`` files.

These tests exercise lower-level SKiDL primitives that do not require
KiCad symbol libraries, so they run portably even on systems where
``KICAD_SYMBOL_DIR`` is unset.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path


def _run_script(script: str) -> subprocess.CompletedProcess[str]:
    """Run a Python snippet in an isolated temp CWD.

    Asserts the script succeeded and that no SKiDL log files leaked.
    """
    with tempfile.TemporaryDirectory(prefix="skidl-pi-tools-") as td:
        result = subprocess.run(
            [sys.executable, "-I", "-c", script],
            cwd=td,
            env=os.environ.copy(),
            check=False,
            capture_output=True,
            text=True,
        )
        leaked = sorted(
            p.name
            for p in Path(td).iterdir()
            if p.name.endswith(".log") or p.name.endswith(".erc")
        )
        assert result.returncode == 0, (
            f"Script failed (rc={result.returncode}):\nSTDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )
        assert leaked == [], f"Leaked log/erc files: {leaked}"
        return result


def test_circuit_lifecycle_and_erc_emit_no_log_files() -> None:
    """Creating a circuit and running ERC on it must not write log files.

    Uses lower-level SKiDL primitives that do not require KiCad libraries,
    so this test is portable across CI environments that may not have
    KiCad installed.
    """
    script = textwrap.dedent(
        """
        from skidl_mcp.circuit_manager import manager
        from skidl import Net

        entry = manager.create("smoke", "smoke")
        # Activate the circuit so Net() attaches to it.
        manager.switch("smoke")
        # An empty-but-valid circuit: just one floating net. ERC should
        # complete (with warnings), never raising.
        Net("DUMMY")
        erc_output = entry.circuit.ERC()
        print("ERC_DONE")
        """
    )
    res = _run_script(script)
    assert "ERC_DONE" in res.stdout, res.stdout


def test_run_erc_tool_no_kicad_returns_clean_response() -> None:
    """The ``run_erc`` tool returns a structured response without log files."""
    script = textwrap.dedent(
        """
        from skidl_mcp.tools import circuit as c_mod
        from skidl_mcp.tools import validate as v_mod
        c_mod.create_circuit("smoke", "smoke")
        # No parts -> tool returns a defined error response, no files written.
        result = v_mod.run_erc()
        assert result["status"] == "error", result
        assert "no parts" in result["message"].lower(), result
        print("RUN_ERC_OK")
        """
    )
    res = _run_script(script)
    assert "RUN_ERC_OK" in res.stdout, res.stdout
