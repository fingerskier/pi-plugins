"""Importing the SKiDL MCP server must not leak log files into the CWD.

SKiDL's logging module creates ``<script>.log`` and ``<script>.erc`` file
handlers at import time. When the Pi plugin is launched, those files appear
in the user's project directory, even when no SKiDL tool is ever invoked.
This regression test ensures the plugin scrubs those file handlers (and any
files they may have already created) before yielding control.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from pathlib import Path


def _run_import_in_temp_cwd(import_target: str) -> Path:
    """Run ``python -c "import <target>"`` in an isolated CWD and return it."""
    with tempfile.TemporaryDirectory(prefix="skidl-pi-test-") as td:
        cwd = Path(td)
        env = os.environ.copy()
        # Force interactive-style behaviour so SKiDL chooses its default
        # ``skidl`` filename rather than something pytest-derived. This keeps
        # the test honest about what the plugin will produce in production
        # use where the top-level frame is also outside the user's project.
        result = subprocess.run(
            [sys.executable, "-I", "-c", f"import {import_target}"],
            cwd=str(cwd),
            env=env,
            check=False,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, (
            f"Importing {import_target!r} failed:\nSTDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )
        # Capture the directory listing before the temp dir is cleaned up.
        leaked = sorted(p.name for p in cwd.iterdir())
        return leaked  # type: ignore[return-value]


def test_importing_skidl_mcp_server_leaves_cwd_clean() -> None:
    """Loading the MCP server module must not write any files to the CWD."""
    leaked = _run_import_in_temp_cwd("skidl_mcp.server")
    offending = [
        name
        for name in leaked
        if name.endswith(".log") or name.endswith(".erc")
    ]
    assert offending == [], (
        "skidl_mcp.server import leaked log/erc files into CWD: "
        f"{offending} (full listing: {leaked})"
    )


def test_importing_skidl_mcp_package_leaves_cwd_clean() -> None:
    """Loading just the top-level package must also be clean."""
    leaked = _run_import_in_temp_cwd("skidl_mcp")
    offending = [
        name
        for name in leaked
        if name.endswith(".log") or name.endswith(".erc")
    ]
    assert offending == [], (
        "skidl_mcp package import leaked log/erc files into CWD: "
        f"{offending} (full listing: {leaked})"
    )
