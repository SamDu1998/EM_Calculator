"""Pure calculation routines and a CLI entry point for the EM Calculator.

The renderer process spawns this script over IPC to cross-verify the in-process
TypeScript implementation. The CLI emits a single line of JSON to stdout that
mirrors the TypeScript `Result<T, E>` shape; non-zero exit codes are reserved
for unexpected runtime failures so the IPC layer can distinguish validation
errors (ok=False) from system errors.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from typing import Any

C_M_PER_S = 299_792_458


def compute_bandwidth(fmin_hz: float, fmax_hz: float) -> dict[str, Any]:
    if not math.isfinite(fmin_hz) or fmin_hz <= 0:
        return {"ok": False, "error": "fmin_not_positive"}
    if not math.isfinite(fmax_hz) or fmax_hz <= fmin_hz:
        return {"ok": False, "error": "fmax_not_greater_than_fmin"}

    absolute_hz = fmax_hz - fmin_hz
    center_hz = (fmin_hz + fmax_hz) / 2
    fractional = absolute_hz / center_hz

    return {
        "ok": True,
        "value": {
            "absoluteHz": absolute_hz,
            "centerHz": center_hz,
            "fractional": fractional,
            "relativePercent": fractional * 100,
        },
    }


def compute_aperture_efficiency(
    frequency_hz: float,
    gain_dbi: float,
    physical_area_m2: float,
) -> dict[str, Any]:
    if not math.isfinite(frequency_hz) or frequency_hz <= 0:
        return {"ok": False, "error": "frequency_not_positive"}
    if not math.isfinite(gain_dbi):
        return {"ok": False, "error": "gain_not_finite"}
    if not math.isfinite(physical_area_m2) or physical_area_m2 <= 0:
        return {"ok": False, "error": "area_not_positive"}

    wavelength_m = C_M_PER_S / frequency_hz
    linear_gain = 10 ** (gain_dbi / 10)
    effective_area_m2 = (wavelength_m**2) / (4 * math.pi) * linear_gain
    efficiency_ratio = effective_area_m2 / physical_area_m2

    return {
        "ok": True,
        "value": {
            "wavelengthM": wavelength_m,
            "effectiveAreaM2": effective_area_m2,
            "efficiencyPercent": efficiency_ratio * 100,
            "exceedsPhysicalLimit": efficiency_ratio > 1,
        },
    }


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="em_calc", description="EM Calculator CLI")
    sub = parser.add_subparsers(dest="action", required=True)

    p_bw = sub.add_parser("bandwidth", help="Relative & absolute bandwidth")
    p_bw.add_argument("--fmin-hz", type=float, required=True)
    p_bw.add_argument("--fmax-hz", type=float, required=True)

    p_ae = sub.add_parser("aperture-efficiency", help="Aperture efficiency")
    p_ae.add_argument("--frequency-hz", type=float, required=True)
    p_ae.add_argument("--gain-dbi", type=float, required=True)
    p_ae.add_argument("--area-m2", type=float, required=True)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.action == "bandwidth":
        result = compute_bandwidth(args.fmin_hz, args.fmax_hz)
    elif args.action == "aperture-efficiency":
        result = compute_aperture_efficiency(args.frequency_hz, args.gain_dbi, args.area_m2)
    else:  # pragma: no cover — argparse enforces required subcommand
        result = {"ok": False, "error": "unknown_action"}

    json.dump(result, sys.stdout, separators=(",", ":"))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
