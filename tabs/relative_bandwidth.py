# relative_bandwidth.py
import tkinter as tk
import ttkbootstrap as ttk
from ttkbootstrap.constants import PRIMARY
from tkinter import messagebox
from utils import update_frequency

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

    unit_menu = ttk.OptionMenu(frame, unit_var, "Hz", "Hz", "kHz", "MHz", "GHz", command=lambda _: update_frequency(low_freq_entry, unit_var, prev_unit_var))
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

    unit_var.trace_add("write", lambda *args: prev_unit_var.set(unit_var.get()))