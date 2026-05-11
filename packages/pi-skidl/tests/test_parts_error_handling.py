"""Regression tests for structured part-tool errors."""

from __future__ import annotations

from skidl_mcp.circuit_manager import manager
from skidl_mcp.tools import parts


def test_add_part_missing_library_returns_structured_error(monkeypatch) -> None:
    manager.reset()
    manager.create("missing_lib")

    def raise_missing_library(*args, **kwargs):
        raise FileNotFoundError("Can't open file: Device.")

    monkeypatch.setattr(parts, "Part", raise_missing_library)

    result = parts.add_part("Device", "R")

    assert result["status"] == "error"
    assert "Device" in result["message"]
    assert "KiCad" in result["message"]
    assert "KICAD" in result["message"]
    assert manager.get_active().parts == {}

    manager.reset()
