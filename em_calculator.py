import tkinter as tk
import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from tkinter import messagebox

def calculate_bandwidth():
    try:
        low_freq = float(low_freq_entry.get())
        high_freq = float(high_freq_entry.get())

        if low_freq <= 0 or high_freq <= 0:
            raise ValueError("Frequencies must be positive numbers.")

        abs_bandwidth = high_freq - low_freq
        rel_bandwidth = (abs_bandwidth / ((high_freq + low_freq) / 2)) * 100

        abs_bandwidth_label.config(state='normal')
        abs_bandwidth_label.delete(1.0, tk.END)
        abs_bandwidth_label.insert(tk.END, f"Absolute Bandwidth: {abs_bandwidth:.2f} {unit_var.get()}")
        abs_bandwidth_label.config(state='disabled')

        rel_bandwidth_label.config(state='normal')
        rel_bandwidth_label.delete(1.0, tk.END)
        rel_bandwidth_label.insert(tk.END, f"Relative Bandwidth: {rel_bandwidth:.2f}%")
        rel_bandwidth_label.config(state='disabled')
    except ValueError as e:
        messagebox.showerror("Input Error", str(e))

# Create the main window
root = ttk.Window(themename="cosmo")
root.title("EM Calculator")
root.geometry("400x300")
root.minsize(400, 300)  # Set minimum window size

# Create a notebook (tabbed interface)
notebook = ttk.Notebook(root, bootstyle="primary")
notebook.pack(fill='both', expand=True)

# Create the first tab
tab1 = ttk.Frame(notebook)
notebook.add(tab1, text="Relative Bandwidth")

# Create the second tab
tab2 = ttk.Frame(notebook)
notebook.add(tab2, text="TBD")

# Configure grid to expand with window
tab1.columnconfigure(0, weight=1)
tab1.rowconfigure(0, weight=1)

# Create and place the widgets in the first tab
frame = ttk.Frame(tab1, padding="10")
frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

# Configure frame grid to expand with window
for i in range(6):
    frame.rowconfigure(i, weight=1)
frame.columnconfigure(0, weight=1)
frame.columnconfigure(1, weight=1)

# Define a modern font
modern_font = ("Helvetica", 12)

unit_var = tk.StringVar(value="Hz")
unit_label = ttk.Label(frame, text="Select Unit:", font=modern_font)
unit_label.grid(row=0, column=0, sticky=tk.W, pady=5)

unit_menu = ttk.OptionMenu(frame, unit_var, "Hz", "Hz", "kHz", "MHz", "GHz")
unit_menu.grid(row=0, column=1, pady=5)

low_freq_label = ttk.Label(frame, text="Low Frequency:", font=modern_font)
low_freq_label.grid(row=1, column=0, sticky=tk.W, pady=5)

low_freq_entry = ttk.Entry(frame, width=20, font=modern_font)
low_freq_entry.grid(row=1, column=1, pady=5)

high_freq_label = ttk.Label(frame, text="High Frequency:", font=modern_font)
high_freq_label.grid(row=2, column=0, sticky=tk.W, pady=5)

high_freq_entry = ttk.Entry(frame, width=20, font=modern_font)
high_freq_entry.grid(row=2, column=1, pady=5)

calculate_button = ttk.Button(frame, text="Calculate", command=calculate_bandwidth, bootstyle=PRIMARY)
calculate_button.grid(row=3, column=0, columnspan=2, pady=10)

abs_bandwidth_label = tk.Text(frame, height=1, width=40, state='disabled', font=modern_font)
abs_bandwidth_label.grid(row=4, column=0, columnspan=2, pady=5)

rel_bandwidth_label = tk.Text(frame, height=1, width=40, state='disabled', font=modern_font)
rel_bandwidth_label.grid(row=5, column=0, columnspan=2, pady=5)

# Add content to the second tab
tbd_label = ttk.Label(tab2, text="This is a placeholder for future development.", font=modern_font)
tbd_label.pack(pady=20)

# Run the application
root.mainloop()