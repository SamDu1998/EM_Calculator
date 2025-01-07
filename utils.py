# utils.py
import tkinter as tk

def update_frequency(freq_entry, unit_var, prev_unit_var):
    try:
        frequency = float(freq_entry.get())
        prev_unit = prev_unit_var.get()
        new_unit = unit_var.get()

        # Convert frequency to Hz first
        if prev_unit == "kHz":
            frequency *= 1e3
        elif prev_unit == "MHz":
            frequency *= 1e6
        elif prev_unit == "GHz":
            frequency *= 1e9

        # Convert frequency from Hz to the new unit
        if new_unit == "kHz":
            frequency /= 1e3
        elif new_unit == "MHz":
            frequency /= 1e6
        elif new_unit == "GHz":
            frequency /= 1e9

        freq_entry.delete(0, tk.END)
        freq_entry.insert(0, f"{frequency:.2f}")
    except ValueError:
        pass
    finally:
        prev_unit_var.set(unit_var.get())