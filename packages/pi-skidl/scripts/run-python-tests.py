"""Run pi-skidl's Python test suite in an isolated package test venv.

This keeps the npm `test` script honest without requiring contributors to
pre-install SKiDL/FastMCP/pytest into their global Python environment.
Set SKIDL_TEST_PYTHON to run tests with an existing interpreter instead.
"""

from __future__ import annotations

import os
import subprocess
import sys
import venv
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
VENV_DIR = Path(os.environ.get("SKIDL_TEST_VENV", ROOT / ".venv-test")).resolve()


def _venv_python(venv_dir: Path) -> Path:
    if os.name == "nt":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def _run(args: list[str], **kwargs) -> None:
    print("[pi-skidl test]", " ".join(args), flush=True)
    subprocess.check_call(args, **kwargs)


def _ensure_test_python() -> Path:
    override = os.environ.get("SKIDL_TEST_PYTHON")
    if override:
        return Path(override).resolve()

    python = _venv_python(VENV_DIR)
    if not python.exists():
        print(f"[pi-skidl test] creating test venv at {VENV_DIR}", flush=True)
        VENV_DIR.parent.mkdir(parents=True, exist_ok=True)
        venv.EnvBuilder(with_pip=True, clear=False, upgrade=False).create(VENV_DIR)

    _run([
        str(python),
        "-m",
        "pip",
        "install",
        "--quiet",
        "--upgrade",
        "--disable-pip-version-check",
        "-e",
        str(ROOT),
        "pytest>=7.0",
        "pytest-asyncio>=0.21",
    ])
    return python


def main() -> int:
    python = _ensure_test_python()
    args = sys.argv[1:] or ["tests/", "-v"]
    return subprocess.call([str(python), "-m", "pytest", *args], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
