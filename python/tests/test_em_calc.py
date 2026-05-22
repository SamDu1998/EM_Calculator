from __future__ import annotations

import json
import math
import subprocess
import sys
from pathlib import Path

import pytest

from em_calc import compute_aperture_efficiency, compute_bandwidth, main

FIXTURES_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "src"
    / "renderer"
    / "lib"
    / "calculations"
    / "fixtures.json"
)
SCRIPT_PATH = Path(__file__).resolve().parent.parent / "em_calc.py"

with FIXTURES_PATH.open(encoding="utf-8") as f:
    FIXTURES = json.load(f)


@pytest.mark.parametrize("fx", FIXTURES["bandwidth"], ids=lambda fx: fx["name"])
def test_bandwidth_matches_fixture(fx: dict) -> None:
    result = compute_bandwidth(fx["fminHz"], fx["fmaxHz"])
    assert result["ok"] is True
    v = result["value"]
    e = fx["expected"]
    assert v["absoluteHz"] == pytest.approx(e["absoluteHz"], rel=1e-12)
    assert v["centerHz"] == pytest.approx(e["centerHz"], rel=1e-12)
    assert v["fractional"] == pytest.approx(e["fractional"], rel=1e-12)
    assert v["relativePercent"] == pytest.approx(e["relativePercent"], rel=1e-12)


@pytest.mark.parametrize(
    "fx", FIXTURES["apertureEfficiency"], ids=lambda fx: fx["name"]
)
def test_aperture_efficiency_matches_fixture(fx: dict) -> None:
    result = compute_aperture_efficiency(
        fx["frequencyHz"], fx["gainDbi"], fx["physicalAreaM2"]
    )
    assert result["ok"] is True
    v = result["value"]
    e = fx["expected"]
    assert v["wavelengthM"] == pytest.approx(e["wavelengthM"], rel=1e-12)
    assert v["effectiveAreaM2"] == pytest.approx(e["effectiveAreaM2"], rel=1e-12)
    assert v["efficiencyPercent"] == pytest.approx(e["efficiencyPercent"], rel=1e-12)
    assert v["exceedsPhysicalLimit"] is e["exceedsPhysicalLimit"]


class TestBandwidthErrors:
    def test_rejects_zero_fmin(self) -> None:
        assert compute_bandwidth(0, 100) == {
            "ok": False,
            "error": "fmin_not_positive",
        }

    def test_rejects_negative_fmin(self) -> None:
        assert compute_bandwidth(-1, 100) == {
            "ok": False,
            "error": "fmin_not_positive",
        }

    def test_rejects_nan_fmin(self) -> None:
        assert compute_bandwidth(math.nan, 100) == {
            "ok": False,
            "error": "fmin_not_positive",
        }

    def test_rejects_equal(self) -> None:
        assert compute_bandwidth(100, 100) == {
            "ok": False,
            "error": "fmax_not_greater_than_fmin",
        }

    def test_rejects_inverted(self) -> None:
        assert compute_bandwidth(200, 100) == {
            "ok": False,
            "error": "fmax_not_greater_than_fmin",
        }


class TestApertureEfficiencyErrors:
    def test_rejects_zero_frequency(self) -> None:
        assert compute_aperture_efficiency(0, 20, 1) == {
            "ok": False,
            "error": "frequency_not_positive",
        }

    def test_rejects_negative_area(self) -> None:
        assert compute_aperture_efficiency(10e9, 20, -1) == {
            "ok": False,
            "error": "area_not_positive",
        }

    def test_rejects_nan_gain(self) -> None:
        assert compute_aperture_efficiency(10e9, math.nan, 1) == {
            "ok": False,
            "error": "gain_not_finite",
        }


class TestCli:
    def test_bandwidth_subcommand(self) -> None:
        proc = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_PATH),
                "bandwidth",
                "--fmin-hz",
                "2.4e9",
                "--fmax-hz",
                "2.4835e9",
            ],
            capture_output=True,
            text=True,
            check=True,
            timeout=10,
        )
        payload = json.loads(proc.stdout)
        assert payload["ok"] is True
        assert payload["value"]["absoluteHz"] == pytest.approx(83.5e6, rel=1e-12)

    def test_aperture_efficiency_subcommand(self) -> None:
        proc = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_PATH),
                "aperture-efficiency",
                "--frequency-hz",
                "10e9",
                "--gain-dbi",
                "30",
                "--area-m2",
                "1.0",
            ],
            capture_output=True,
            text=True,
            check=True,
            timeout=10,
        )
        payload = json.loads(proc.stdout)
        assert payload["ok"] is True
        assert payload["value"]["efficiencyPercent"] == pytest.approx(
            7.152066466270221, rel=1e-12
        )

    def test_main_invokable(self, capsys: pytest.CaptureFixture[str]) -> None:
        exit_code = main(
            ["bandwidth", "--fmin-hz", "1000", "--fmax-hz", "1010"]
        )
        assert exit_code == 0
        out = capsys.readouterr().out
        payload = json.loads(out)
        assert payload["ok"] is True
        assert payload["value"]["absoluteHz"] == pytest.approx(10, rel=1e-12)
