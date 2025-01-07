# aperture_efficiency.py
import tkinter as tk
import ttkbootstrap as ttk
from ttkbootstrap.constants import PRIMARY
from tkinter import messagebox
import math
from utils import update_frequency

def calculate_aperture_efficiency(freq_entry, gain_entry, area_entry, efficiency_label, unit_var):
    try:
        frequency = float(freq_entry.get())
        gain = float(gain_entry.get())
        area = float(area_entry.get())
        unit = unit_var.get()

        if frequency <= 0 or area <= 0:
            raise ValueError("Frequency and area must be positive numbers.")

        # Convert frequency based on the selected unit
        if unit == "kHz":
            frequency *= 1e3
        elif unit == "MHz":
            frequency *= 1e6
        elif unit == "GHz":
            frequency *= 1e9

        speed_of_light = 3e8  # Speed of light in m/s
        k0 = speed_of_light / frequency
        a0 = (k0 ** 2 / (4 * math.pi)) * (10 ** (gain / 10))
        efficiency = (a0 / area) * 100

        efficiency_label.config(state='normal')
        efficiency_label.delete(1.0, tk.END)
        efficiency_label.insert(tk.END, f"Aperture Efficiency: {efficiency:.2f}%")
        efficiency_label.config(state='disabled')
    except ValueError as e:
        messagebox.showerror("Input Error", str(e))

def create_aperture_efficiency_tab(notebook, modern_font):
    tab3 = ttk.Frame(notebook)
    notebook.add(tab3, text="Aperture Efficiency")

    tab3.columnconfigure(0, weight=1)
    tab3.rowconfigure(0, weight=1)

    frame = ttk.Frame(tab3, padding="10")
    frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

    for i in range(6):
        frame.rowconfigure(i, weight=1)
    frame.columnconfigure(0, weight=1)
    frame.columnconfigure(1, weight=1)

    unit_var = tk.StringVar(value="Hz")
    prev_unit_var = tk.StringVar(value="Hz")
    unit_label = ttk.Label(frame, text="Select Unit:", font=modern_font)
    unit_label.grid(row=0, column=0, sticky=tk.W, pady=5)

    unit_menu = ttk.OptionMenu(frame, unit_var, "Hz", "Hz", "kHz", "MHz", "GHz", command=lambda _: update_frequency(freq_entry, unit_var, prev_unit_var))
    unit_menu.grid(row=0, column=1, pady=5)

    freq_label = ttk.Label(frame, text="Frequency:", font=modern_font)
    freq_label.grid(row=1, column=0, sticky=tk.W, pady=5)

    freq_entry = ttk.Entry(frame, width=20, font=modern_font)
    freq_entry.grid(row=1, column=1, pady=5)

    gain_label = ttk.Label(frame, text="Gain (dBi):", font=modern_font)
    gain_label.grid(row=2, column=0, sticky=tk.W, pady=5)

    gain_entry = ttk.Entry(frame, width=20, font=modern_font)
    gain_entry.grid(row=2, column=1, pady=5)

    area_label = ttk.Label(frame, text="Antenna Area (m^2):", font=modern_font)
    area_label.grid(row=3, column=0, sticky=tk.W, pady=5)

    area_entry = ttk.Entry(frame, width=20, font=modern_font)
    area_entry.grid(row=3, column=1, pady=5)

    efficiency_label = tk.Text(frame, height=1, width=40, state='disabled', font=modern_font)
    efficiency_label.grid(row=5, column=0, columnspan=2, pady=5)

    calculate_button = ttk.Button(frame, text="Calculate", command=lambda: calculate_aperture_efficiency(freq_entry, gain_entry, area_entry, efficiency_label, unit_var), bootstyle=PRIMARY)
    calculate_button.grid(row=4, column=0, columnspan=2, pady=10)