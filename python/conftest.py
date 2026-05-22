"""Make the ``python`` directory importable so tests can ``import em_calc``."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
