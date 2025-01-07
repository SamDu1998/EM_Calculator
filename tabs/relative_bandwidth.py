import tkinter as tk
import ttkbootstrap as ttk
from ttkbootstrap.constants import PRIMARY
from tkinter import messagebox

# Conversion factors
conversion_factors = {"Hz": 1, "kHz": 1e3, "MHz": 1e6, "GHz": 1e9}

def convert_to_base(value, unit):
    return value * conversion_factors[unit]

def convert_from_base(value, unit):
    return value / conversion_factors[unit]

def update_frequency(entry, new_unit, old_unit):
    try:
        value = float(entry.get())
        value_in_base = convert_to_base(value, old_unit)
        new_value = convert_from_base(value_in_base, new_unit)
        entry.delete(0, tk.END)
        entry.insert(0, f"{new_value:.2f}")
    except ValueError:
        entry.delete(0, tk.END)
        entry.insert(0, "0")

def create_relative_bandwidth_tab(notebook, modern_font):
    tab1 = ttk.Frame(notebook)
    notebook.add(tab1, text="Relative Bandwidth")

    tab1.columnconfigure(0, weight=1)
    tab1.rowconfigure(0, weight=1)

    frame = ttk.Frame(tab1, padding="10")
    frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

    for i in range(6):
        frame.rowconfigure(i, weight=1)
    frame.columnconfigure(0, weight=1)
    frame.columnconfigure(1, weight=1)

    unit_var = tk.StringVar(value="Hz")
    prev_unit_var = tk.StringVar(value="Hz")
    unit_label = ttk.Label(frame, text="Select Unit:", font=modern_font)
    unit_label.grid(row=0, column=0, sticky=tk.W, pady=5)

    unit_menu = ttk.OptionMenu(frame, unit_var, "Hz", "Hz", "kHz", "MHz", "GHz", command=lambda _: update_units())
    unit_menu.grid(row=0, column=1, pady=5)

    low_freq_label = ttk.Label(frame, text="Low Frequency:", font=modern_font)
    low_freq_label.grid(row=1, column=0, sticky=tk.W, pady=5)

    low_freq_entry = ttk.Entry(frame, width=20, font=modern_font)
    low_freq_entry.grid(row=1, column=1, pady=5)

    high_freq_label = ttk.Label(frame, text="High Frequency:", font=modern_font)
    high_freq_label.grid(row=2, column=0, sticky=tk.W, pady=5)

    high_freq_entry = ttk.Entry(frame, width=20, font=modern_font)
    high_freq_entry.grid(row=2, column=1, pady=5)

    abs_bandwidth_label = tk.Text(frame, height=1, width=40, state='disabled', font=modern_font)
    abs_bandwidth_label.grid(row=4, column=0, columnspan=2, pady=5)

    rel_bandwidth_label = tk.Text(frame, height=1, width=40, state='disabled', font=modern_font)
    rel_bandwidth_label.grid(row=5, column=0, columnspan=2, pady=5)

    calculate_button = ttk.Button(frame, text="Calculate", command=lambda: calculate_bandwidth(low_freq_entry, high_freq_entry, abs_bandwidth_label, rel_bandwidth_label, unit_var), bootstyle=PRIMARY)
    calculate_button.grid(row=3, column=0, columnspan=2, pady=10)

    def update_units():
        old_unit = prev_unit_var.get()
        new_unit = unit_var.get()
        if old_unit != new_unit:
            update_frequency(low_freq_entry, new_unit, old_unit)
            update_frequency(high_freq_entry, new_unit, old_unit)
            prev_unit_var.set(new_unit)

    unit_var.trace_add("write", lambda *args: update_units())

def calculate_bandwidth(low_freq_entry, high_freq_entry, abs_bandwidth_label, rel_bandwidth_label, unit_var):
    try:
        low_freq = float(low_freq_entry.get())
        high_freq = float(high_freq_entry.get())

        # Convert both to base unit (Hz) for calculation
        low_freq_hz = convert_to_base(low_freq, unit_var.get())
        high_freq_hz = convert_to_base(high_freq, unit_var.get())

        absolute_bw = high_freq_hz - low_freq_hz
        relative_bw = absolute_bw / low_freq_hz

        # Convert absolute bandwidth back to the display unit
        abs_bw_display = convert_from_base(absolute_bw, unit_var.get())
        rel_bw_display = relative_bw  # Relative bandwidth is dimensionless

        abs_bandwidth_label.config(state='normal')
        abs_bandwidth_label.delete(1.0, tk.END)
        abs_bandwidth_label.insert(tk.END, f"{abs_bw_display:.2f} {unit_var.get()}")
        abs_bandwidth_label.config(state='disabled')

        rel_bandwidth_label.config(state='normal')
        rel_bandwidth_label.delete(1.0, tk.END)
        rel_bandwidth_label.insert(tk.END, f"{rel_bw_display:.2%}")
        rel_bandwidth_label.config(state='disabled')
    except ValueError:
        messagebox.showerror("Error", "Please enter valid numeric values.")
