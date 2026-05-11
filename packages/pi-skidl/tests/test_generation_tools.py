"""Regression tests for SKiDL generation wrappers.

These tests use fake circuit objects so they do not require KiCad symbol
libraries, netlistsvg, or actual schematic routing to be available locally.
They verify that the Pi wrapper passes the right upstream SKiDL arguments
and reads the files SKiDL actually writes.
"""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

from skidl_mcp.tools import generate


class _FakeManager:
    def __init__(self, entry):
        self._entry = entry

    def get_active(self):
        return self._entry


def _entry(circuit, name: str = "review circuit"):
    return SimpleNamespace(
        name=name,
        circuit=circuit,
        parts={"R1": object()},
        nets={"N1": object()},
    )


def test_generate_netlist_disables_upstream_backup_file(monkeypatch, tmp_path) -> None:
    calls = []

    class FakeCircuit:
        def generate_netlist(self, *, file_, do_backup=True, **kwargs):
            calls.append({"file_": file_, "do_backup": do_backup, "kwargs": kwargs})
            Path(file_).write_text("NETLIST", encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(generate, "manager", _FakeManager(_entry(FakeCircuit())))

    result = generate.generate_netlist()

    assert result["status"] == "ok"
    assert result["content"] == "NETLIST"
    assert calls and calls[0]["do_backup"] is False
    assert not (tmp_path / "skidl_sklib.py").exists()


def test_generate_svg_reads_actual_svg_sidecar(monkeypatch, tmp_path) -> None:
    calls = []

    class FakeCircuit:
        def generate_svg(self, *, file_):
            calls.append(file_)
            Path(file_ + ".json").write_text("{}", encoding="utf-8")
            Path(file_ + "_skin.svg").write_text("<svg id='skin'/>", encoding="utf-8")
            Path(file_ + ".svg").write_text("<svg id='schematic'/>", encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(generate, "manager", _FakeManager(_entry(FakeCircuit(), name="Circuit With Spaces!")))

    result = generate.generate_svg()

    assert result["status"] == "ok"
    assert result["content"] == "<svg id='schematic'/>"
    # SKiDL expects file_ to be a basename, not the final .svg file path.
    assert calls and not calls[0].endswith(".svg")
    assert list(tmp_path.iterdir()) == []


def test_generate_kicad_schematic_uses_filepath_and_top_name(monkeypatch, tmp_path) -> None:
    calls = []

    class FakeCircuit:
        def generate_schematic(self, **kwargs):
            calls.append(kwargs)
            assert "file_" not in kwargs
            output = Path(kwargs["filepath"]) / f"{kwargs['top_name']}.kicad_sch"
            output.write_text("KICAD_SCH", encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(generate, "manager", _FakeManager(_entry(FakeCircuit(), name="Bad Name!*")))

    result = generate.generate_kicad_schematic()

    assert result["status"] == "ok"
    assert result["content"] == "KICAD_SCH"
    assert calls and calls[0]["top_name"] == "Bad_Name"
    assert Path(calls[0]["filepath"]).is_absolute()
    assert list(tmp_path.iterdir()) == []
