# utils.py
import tkinter as tk

def update_frequency(freq_entry, unit_var, prev_unit_var):
    try:
        # Attempt to convert and update regardless of ValueError
        frequency = float(freq_entry.get())
        prev_unit = prev_unit_var.get()
        new_unit = unit_var.get()

        # Convert to Hz, perform operation, then convert back
        frequency = convert_to_base(frequency, prev_unit)
        # No operation needed here; we're just demonstrating conversion
        frequency = convert_from_base(frequency, new_unit)

        freq_entry.delete(0, tk.END)
        freq_entry.insert(0, f"{frequency:.2f}")
    finally:
        prev_unit_var.set(unit_var.get())


def convert_to_base(value, unit):
    """Convert to Hz."""
    conversion_factors = {"Hz": 1, "kHz": 1e3, "MHz": 1e6, "GHz": 1e9}
    return value * conversion_factors[unit]


def convert_from_base(value, unit):
    """Convert from Hz."""
    conversion_factors = {"Hz": 1, "kHz": 1e-3, "MHz": 1e-6, "GHz": 1e-9}
    return value * conversion_factors[unit]
